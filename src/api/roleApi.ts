import request from '@/utils/http'
import { BaseResult } from '@/types/axios'
import { Role } from './model/roleModel'

export class RoleService {
  // 获取用户所有可用角色
  static getUserAllRoles() {
    return request.get<BaseResult<Role[]>>({
      url: '/api/admin/role/userAllRole'
    })
  }
}
