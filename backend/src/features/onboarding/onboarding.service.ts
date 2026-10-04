import { createHash, randomBytes } from 'node:crypto';
import type { FilterQuery } from 'mongoose';
import { Onboarding, type Onboarding as OnboardingDoc } from './onboarding.model';
import { Employee } from '../employee/employee.model';
import { env } from '../../config/env';
import logger from '../../config/logger';
import { isEmailEnabled, sendOnboardingActivationEmail } from '../../services/email.service';
import { ApiError } from '../../utils/ApiError';
import { parsePagination, type PaginatedResult } from '../../types/pagination';
import type { Lean } from '../../types/lean';
import { User } from '../auth/auth.model';

export interface ListOnboardingsOptions {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 1 | -1;
  isCompleted?: boolean;
  department?: string;
  search?: string;
}

function buildFilter(options: ListOnboardingsOptions): FilterQuery<OnboardingDoc> {
  const filter: FilterQuery<OnboardingDoc> = {};

  // Default: only profiles still awaiting activation. Pass isCompleted explicitly to list others.
  if (options.isCompleted !== undefined) {
    filter.isCompleted = options.isCompleted;
  } else {
    filter.isCompleted = false;
  }
  if (options.department) {
    filter['employmentInfo.department'] = options.department;
  }
  if (options.search) {
    filter.$or = [
      { 'personalDetails.firstName': { $regex: options.search, $options: 'i' } },
      { 'personalDetails.lastName': { $regex: options.search, $options: 'i' } },
      { 'personalDetails.email': { $regex: options.search, $options: 'i' } },
      { 'employmentInfo.employeeId': { $regex: options.search, $options: 'i' } },
    ];
  }

  return filter;
}

export async function listOnboardings(
  options: ListOnboardingsOptions,
): Promise<PaginatedResult<Lean<Onboarding>>> {
  const filter = buildFilter(options);

  const [items, totalItems] = await Promise.all([
    Onboarding.find(filter)
      .sort({ [options.sortBy]: options.sortOrder })
      .skip((options.page - 1) * options.limit)
      .limit(options.limit)
      .lean(),
    Onboarding.countDocuments(filter),
  ]);

  return {
    items,
    totalItems,
    totalPages: Math.ceil(totalItems / options.limit),
    currentPage: options.page,
    limit: options.limit,
  };
}

export async function getOnboardingById(id: string): Promise<Lean<Onboarding>> {
  const onboarding = await Onboarding.findById(id).lean();
  if (!onboarding) {
    throw ApiError.notFound('Onboarding profile not found');
  }
  return onboarding;
}

export async function createOnboarding(
  data: Record<string, unknown>,
): Promise<Lean<Onboarding>> {
  const employeeId = (data.employmentInfo as { employeeId?: string })?.employeeId;
  if (employeeId) {
    const exists = await Onboarding.exists({ 'employmentInfo.employeeId': employeeId });
    if (exists) {
      throw ApiError.conflict(`An onboarding profile already exists for employee id ${employeeId}`);
    }
  }

  const onboarding = await Onboarding.create(data);
  return onboarding.toObject();
}

export async function updateOnboarding(
  id: string,
  data: Record<string, unknown>,
): Promise<Lean<Onboarding>> {
  const onboarding = await Onboarding.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  }).lean();

  if (!onboarding) {
    throw ApiError.notFound('Onboarding profile not found');
  }

  // Auto-complete once all 4 checklist items are done and step 4 is reached
  if (
    !onboarding.isCompleted &&
    onboarding.currentStep >= 4 &&
    onboarding.checklist?.trainingCompleted &&
    onboarding.checklist?.emailCreated &&
    onboarding.checklist?.payrollAdded &&
    onboarding.checklist?.systemAccessGranted
  ) {
    await Onboarding.updateOne({ _id: id }, { isCompleted: true });
    onboarding.isCompleted = true;
  }

  return onboarding;
}

export async function advanceOnboardingStep(id: string, step: number): Promise<Lean<Onboarding>> {
  const onboarding = await Onboarding.findById(id);
  if (!onboarding) {
    throw ApiError.notFound('Onboarding profile not found');
  }

  onboarding.currentStep = step;
  if (step >= 4) {
    onboarding.isCompleted = true;
  }
  await onboarding.save();

  return onboarding.toObject();
}

function hashActivationToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function buildActivationLink(token: string): string {
  return `${env.FRONTEND_URL}/onboarding/decision/${token}`;
}

export async function activateOnboarding(
  id: string,
): Promise<{
  employee: Lean<Employee>;
  accountCreated: boolean;
  emailSent: boolean;
  activationLink: string;
}> {
  const onboarding = await Onboarding.findById(id);
  if (!onboarding) {
    throw ApiError.notFound('Onboarding profile not found');
  }

  if (onboarding.activationStatus !== 'Pending') {
    throw ApiError.conflict(
      `This onboarding profile has already been ${onboarding.activationStatus.toLowerCase()}`,
    );
  }

  const { personalDetails, employmentInfo } = onboarding;

  const existing = await Employee.findOne({ email: personalDetails.email });
  if (existing) {
    throw ApiError.conflict('An employee with this email already exists');
  }

  const employee = await Employee.create({
    firstName: personalDetails.firstName,
    lastName: personalDetails.lastName,
    email: personalDetails.email,
    phone: personalDetails.phone,
    dob: personalDetails.dob,
    gender: personalDetails.gender,
    address: personalDetails.address,
    emergencyContact: {
      name: personalDetails.emergencyContact.split('(')[0]?.trim() ?? '',
      relationship: 'Emergency Contact',
      phone: personalDetails.emergencyContact.split(')-')[1]?.trim() ?? '',
    },
    employeeId: employmentInfo.employeeId,
    department: employmentInfo.department,
    designation: employmentInfo.designation,
    employmentType: employmentInfo.employmentType,
    joiningDate: employmentInfo.joiningDate,
    reportingManagerId: employmentInfo.reportingManagerId,
    salary: employmentInfo.salary,
    status: 'Onboarding',
  });

  const fullName = `${personalDetails.firstName} ${personalDetails.lastName}`;
  const existingUser = await User.findOne({ email: personalDetails.email });

  if (existingUser) {
    // Link any existing user account with the same email to this pending employee
    await User.updateOne(
      { email: personalDetails.email },
      { employeeId: employee._id.toString() },
    );
  } else {
    // Create a pending login account — activated only when the invite is accepted
    const temporaryPassword = randomBytes(24).toString('base64url');
    await User.create({
      name: fullName,
      email: personalDetails.email,
      password: temporaryPassword,
      role: 'Employee',
      employeeId: employee._id.toString(),
      isActive: false,
    });
  }

  const token = randomBytes(32).toString('hex');
  await Onboarding.updateOne(
    { _id: id },
    {
      linkedEmployeeId: employee._id.toString(),
      activationStatus: 'Pending',
      activationTokenHash: hashActivationToken(token),
      activationTokenExpiresAt: new Date(
        Date.now() + env.INVITATION_EXPIRES_HOURS * 60 * 60 * 1000,
      ),
      isCompleted: true,
    },
  );

  const acceptLink = buildActivationLink(token);

  const emailSent = isEmailEnabled();
  if (emailSent) {
    await sendOnboardingActivationEmail({
      to: personalDetails.email,
      name: personalDetails.firstName,
      acceptLink,
    });
  } else {
    logger.info(`🔗 [DEV] Accept link: ${acceptLink}`);
  }

  return {
    employee: employee.toObject(),
    accountCreated: !existingUser,
    emailSent,
    activationLink: env.isProduction ? '' : acceptLink,
  };
}

export async function getOnboardingDecisionByToken(
  token: string,
): Promise<{
  id: string;
  name: string;
  email: string;
  designation: string;
  status: string;
  expiresAt: Date;
}> {
  const onboarding = await Onboarding.findOne({
    activationTokenHash: hashActivationToken(token),
  });
  if (!onboarding) {
    throw ApiError.notFound('Onboarding decision link not found or already used');
  }

  const status = resolveActivationStatus(onboarding);
  if (status === 'Expired' && onboarding.activationStatus !== 'Expired') {
    await Onboarding.updateOne({ _id: onboarding._id }, { activationStatus: 'Expired' });
  }

  return {
    id: onboarding._id.toString(),
    name: `${onboarding.personalDetails.firstName} ${onboarding.personalDetails.lastName}`,
    email: onboarding.personalDetails.email,
    designation: onboarding.employmentInfo.designation,
    status,
    expiresAt: onboarding.activationTokenExpiresAt!,
  };
}

export async function acceptOnboarding(
  token: string,
  password: string,
): Promise<{ email: string; name: string; role: string }> {
  const onboarding = await Onboarding.findOne({
    activationTokenHash: hashActivationToken(token),
  });
  if (!onboarding) {
    throw ApiError.notFound('Onboarding decision link not found or already used');
  }

  const status = resolveActivationStatus(onboarding);
  if (status === 'Expired') {
    throw ApiError.badRequest('This decision link has expired. Please contact HR.');
  }
  if (onboarding.activationStatus === 'Accepted') {
    throw ApiError.badRequest('This onboarding has already been accepted');
  }

  const employee = onboarding.linkedEmployeeId
    ? await Employee.findById(onboarding.linkedEmployeeId)
    : null;

  const user = await User.findOne({ email: onboarding.personalDetails.email });
  if (!user) {
    throw ApiError.badRequest('Account setup is incomplete. Please contact HR.');
  }
  if (!user.isActive) {
    user.isActive = true;
  }
  if (password) {
    user.password = password;
  }
  await user.save();

  if (employee) {
    await Employee.updateOne(
      { _id: employee._id },
      { status: 'Active' },
    );
  }

  await Onboarding.updateOne(
    { _id: onboarding._id },
    { activationStatus: 'Accepted', activationTokenHash: null, activationTokenExpiresAt: null },
  );

  logger.info(`✅ Onboarding accepted: ${onboarding.personalDetails.email}`);

  return {
    email: onboarding.personalDetails.email,
    name: `${onboarding.personalDetails.firstName} ${onboarding.personalDetails.lastName}`,
    role: 'Employee',
  };
}

function resolveActivationStatus(
  onboarding: { activationStatus: string; activationTokenExpiresAt?: Date | null },
): string {
  if (
    onboarding.activationStatus === 'Pending' &&
    onboarding.activationTokenExpiresAt &&
    onboarding.activationTokenExpiresAt.getTime() < Date.now()
  ) {
    return 'Expired';
  }
  return onboarding.activationStatus;
}

export async function deleteOnboarding(id: string): Promise<void> {
  const result = await Onboarding.findByIdAndDelete(id);
  if (!result) {
    throw ApiError.notFound('Onboarding profile not found');
  }
}

export function buildListOptions(query: Record<string, unknown>): ListOnboardingsOptions {
  const pagination = parsePagination(query as Record<string, string>);
  return {
    ...pagination,
    isCompleted:
      query.isCompleted === 'true' ? true : query.isCompleted === 'false' ? false : undefined,
    department: query.department as string | undefined,
    search: query.search as string | undefined,
  };
}
