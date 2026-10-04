import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ApiResponse } from '../../utils/ApiResponse';
import { catchAsync } from '../../utils/catchAsync';
import * as employeeService from './employee.service';

export const createEmployee = catchAsync(async (req: Request, res: Response) => {
  const employee = await employeeService.createEmployee(req.body);
  res
    .status(StatusCodes.CREATED)
    .json(new ApiResponse(StatusCodes.CREATED, 'Employee created successfully', employee));
});

export const getEmployees = catchAsync(async (req: Request, res: Response) => {
  const options = employeeService.buildListOptions(req.query);
  const result = await employeeService.listEmployees(options);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Employees fetched', result.items, result));
});

export const getEmployee = catchAsync(async (req: Request, res: Response) => {
  const employee = await employeeService.getEmployeeById(req.params.id);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Employee fetched', employee));
});

export const updateEmployee = catchAsync(async (req: Request, res: Response) => {
  const employee = await employeeService.updateEmployee(req.params.id, req.body);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Employee updated', employee));
});

export const updateEmployeeStatus = catchAsync(async (req: Request, res: Response) => {
  const employee = await employeeService.updateEmployeeStatus(
    req.params.id,
    (req.body as { status: string }).status,
  );
  res
    .status(StatusCodes.OK)
    .json(new ApiResponse(StatusCodes.OK, 'Employee status updated', employee));
});

export const deleteEmployee = catchAsync(async (req: Request, res: Response) => {
  await employeeService.deleteEmployee(req.params.id);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Employee deleted'));
});

export const getDepartments = catchAsync(async (_req: Request, res: Response) => {
  const departments = await employeeService.getDepartments();
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Departments fetched', departments));
});
