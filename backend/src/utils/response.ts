export const successResponse = <T>(data: T, pagination?: any) => {
  return {
    success: true,
    data,
    ...(pagination ? { pagination } : {}),
  };
};

export const errorResponse = (code: string, message: string) => {
  return {
    success: false,
    error: {
      code,
      message,
    },
  };
};
