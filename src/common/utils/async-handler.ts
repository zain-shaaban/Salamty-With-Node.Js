import { HttpException, InternalServerErrorException } from '@nestjs/common';

export async function asyncHandler<T>(task: Promise<T>): Promise<T> {
  try {
    return await task;
  } catch (error) {
    if(error instanceof HttpException)
      throw new HttpException(error.message,error.getStatus())
    throw new InternalServerErrorException(error.message)
  }
}
