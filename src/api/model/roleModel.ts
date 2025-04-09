/**
 * 角色相关模型
 */

// 角色基本信息
export interface Role {
  id: number
  name: string
}

// 注：接口响应使用通用的 BaseResult<Role[]> 类型
// 不再需要单独定义 RoleListResponse
