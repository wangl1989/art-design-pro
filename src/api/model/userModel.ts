/**
 * 用户相关模型定义
 */
export interface UserDetailResponse {
  id: number
  loginName: string
  nickName: string
  icon: string
  email: string
  tel: string
  roles: Array<{
    id: number
    name: string
  }>
  permissions: Array<{
    id: number
    permissionName: string
    permissionCode: string
    permissionType: string
    icon: string | null
    sort: number
    remarks: string | null
    menu?: {
      id: number
      name: string
      parentId: number
      parentIds: string
      level: string
      sort: number
      remarks: string | null
    }
    button?: {
      id: number
      buttonKey: string
      buttonName: string
    } | null
    api?: {
      id: number
      apiUrl: string
      httpMethod: string
      common: boolean
    } | null
    page?: {
      id: number
      pageUrl: string
    } | null
  }>
  delFlag: boolean
  deviceId: string | null
}

/**
 * 用户列表查询参数
 */
export interface UserListParams {
  loginName?: string // 用户名，模糊搜索
  tel?: string // 手机号，精确搜索
  email?: string // 邮箱，模糊搜索
  sortByCreateDateAsc?: boolean | null // 根据创建时间排序
  sortByLoginNameAsc?: boolean | null // 根据用户名排序
  sortByUpdateDateAsc?: boolean | null // 根据更新时间排序
  page?: number // 页码，默认1
  limit?: number // 每页数量，默认10
}

/**
 * 用户记录模型
 */
export interface UserRecord {
  id: number
  loginName: string
  nickName: string
  icon: string
  email: string
  tel: string
  locked: boolean
  delFlag: boolean
  remarks: string
  createDate: string
  createUserNickName: string
  createUserLoginName: string
  createId: number
  updateDate: string
  updateUserNickName: string
  updateUserLoginName: string
  updateId: number
  roles: Array<{
    id: number
    name: string
  }>
}

/**
 * 分页数据结构
 */
export interface PageData<T> {
  records: T[]
  total: number
  size: number
  current: number
  pages: number
}

/**
 * 用户列表响应
 */
export interface UserListResponse {
  data: PageData<UserRecord>
  code: number
  success: boolean
  message: string
  timestamp: number
}
