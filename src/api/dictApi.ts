import request from '@/utils/http'
import { PageResult, BaseResult } from '@/types/axios'
import {
  DictRecord,
  DictListParams,
  AddDictParams,
  EditDictParams,
  EditDictTypeParams
} from './model/dictModel'

export class DictService {
  // 获取资源分页列表
  static getDictList(params: DictListParams) {
    return request.get<PageResult<DictRecord>>({
      url: '/api/admin/dict/list',
      params
    })
  }

  // 新增字典
  static addDict(params: AddDictParams) {
    return request.post<BaseResult>({
      url: '/api/admin/dict/add',
      params
    })
  }

  // 编辑字典
  static updateDict(params: EditDictParams) {
    return request.put<BaseResult>({
      url: '/api/admin/dict/edit',
      params
    })
  }

  // 删除字典
  static editDictType(params: EditDictTypeParams) {
    return request.put<BaseResult>({
      url: '/api/admin/dict/editType',
      params
    })
  }

  // 删除字典
  static deleteDict(id: number) {
    return request.del<BaseResult>({
      url: `/api/admin/dict/delete?id=${id}`
    })
  }
}
