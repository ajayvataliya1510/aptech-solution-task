export const successResponse = <T>(data: T, pagination?: { page: number; limit: number; total: number; totalPages: number }) => {
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
