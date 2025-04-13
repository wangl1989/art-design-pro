export interface LogRecord {
  id: string
  createId: number
  createDate: string
  updateId: number
  updateDate: string
  delFlag: boolean
  remarks: string | null
  createUser: string | null
  updateUser: string | null
  type: string | null
  title: string | null
  remoteAddr: string | null
  username: string | null
  requestUri: string | null
  httpMethod: string | null
  classMethod: string | null
  params: string | null
  response: string | string
  useTime: number | 0
  browser: string | string
  area: string | string
  province: string | string
  city: string | null
  isp: string | null
  exception: string | null
}
