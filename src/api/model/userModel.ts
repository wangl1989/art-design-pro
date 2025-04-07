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
