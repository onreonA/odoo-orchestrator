// Department service - placeholder
// This service was removed but some imports still reference it
export function getDepartmentService() {
  return {
    getDepartments: async () => ({ data: [], error: null }),
    getDepartmentById: async (id: string) => ({ data: null, error: { message: 'Not implemented' } }),
    createDepartment: async () => ({ data: null, error: { message: 'Not implemented' } }),
  }
}

