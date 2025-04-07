import request from '@/utils/http'
import { BaseResult } from '@/types/axios'
import { getDeviceId } from '@/utils/http/token'

// api
export class ApiService {
  static getApiList(params: any) {
    return request.post<BaseResult>({
      url: '/api/getApiList',
      params
    })
  }

  static refreshToken(params: string) {
    const deviceId = getDeviceId()
    return request.post<BaseResult>({
      url: '/api/auth/refresh',
      params,
      headers: {
        'Device-Id': deviceId
      }
    })
  }
}
