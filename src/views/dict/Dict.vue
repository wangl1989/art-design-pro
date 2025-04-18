<template>
  <div class="page-content">
    <table-bar
      :showTop="false"
      @search="search"
      @reset="resetQuery"
      @changeColumn="changeColumn"
      :columns="columns"
    >
      <template #top>
        <el-form :model="queryParams" inline>
          <el-row :gutter="15">
            <el-col :xs="19" :sm="12" :lg="6">
              <el-form-item>
                <el-input v-model="queryParams.type" placeholder="请输入字典类型搜索"></el-input>
              </el-form-item>
            </el-col>
            <el-col :xs="19" :sm="12" :lg="6">
              <el-form-item>
                <el-input v-model="queryParams.label" placeholder="请输入标签名搜索"></el-input>
              </el-form-item>
            </el-col>
            <el-col :xs="19" :sm="12" :lg="6">
              <el-form-item>
                <el-input v-model="queryParams.value" placeholder="请输入数据值搜索"></el-input>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </template>
      <template #bottom>
        <el-button type="primary" @click="handleAdd" v-ripple>新增字典</el-button>
      </template>
    </table-bar>

    <art-table
      :data="dictList"
      v-loading="loading"
      pagination
      :currentPage="pagination.current"
      :pageSize="pagination.size"
      :total="pagination.total"
      @current-change="handleCurrentChange"
      @size-change="handleSizeChange"
    >
      <el-table-column label="字典类型" prop="type" v-if="columns[0].show" />
      <el-table-column label="标签名" prop="label" v-if="columns[1].show" />
      <el-table-column label="数据值" prop="value" v-if="columns[2].show" />
      <el-table-column label="描述" prop="description" v-if="columns[3].show" />
      <el-table-column label="排序" prop="sort" sortable v-if="columns[4].show" />
      <el-table-column label="创建时间" prop="createDate" sortable v-if="columns[5].show" />
      <el-table-column label="更新时间" prop="updateDate" sortable v-if="columns[6].show" />
      <el-table-column label="操作" fixed="right" width="280" v-if="columns[7].show">
        <template #default="scope">
          <el-button size="small" type="primary" link @click="handleEdit(scope.row)">
            编辑
          </el-button>
          <el-button size="small" type="success" link @click="handleAddByType(scope.row)">
            添加该类型字典
          </el-button>
          <el-button size="small" type="warning" link @click="handleEditType(scope.row)">
            编辑类型
          </el-button>
          <el-button size="small" type="danger" link @click="handleDelete(scope.row)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </art-table>

    <!-- 添加/编辑字典对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑字典' : '新增字典'"
      width="500px"
      destroy-on-close
    >
      <el-form
        ref="dictFormRef"
        :model="formData"
        :rules="rules"
        label-width="100px"
        class="dict-form"
      >
        <el-form-item label="字典类型" prop="type">
          <el-input
            v-model="formData.type"
            placeholder="请输入字典类型"
            :disabled="typeDisabled"
          ></el-input>
        </el-form-item>
        <el-form-item label="标签名" prop="label">
          <el-input v-model="formData.label" placeholder="请输入标签名"></el-input>
        </el-form-item>
        <el-form-item label="数据值" prop="value">
          <el-input v-model="formData.value" placeholder="请输入数据值"></el-input>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            type="textarea"
            v-model="formData.description"
            placeholder="请输入描述"
            :rows="3"
          ></el-input>
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="formData.sort" :min="0" :max="999" controls-position="right" />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitLoading">确定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 编辑字典类型对话框 -->
    <el-dialog v-model="typeDialogVisible" title="编辑字典类型" width="500px" destroy-on-close>
      <el-form
        ref="typeFormRef"
        :model="typeFormData"
        :rules="typeRules"
        label-width="100px"
        class="dict-form"
      >
        <el-form-item label="原字典类型" prop="oldType">
          <el-input v-model="typeFormData.oldType" disabled></el-input>
        </el-form-item>
        <el-form-item label="新字典类型" prop="newType">
          <el-input v-model="typeFormData.newType" placeholder="请输入新的字典类型"></el-input>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="typeDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitTypeForm" :loading="submitLoading"
            >确定</el-button
          >
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, onMounted } from 'vue'
  import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus'
  import { DictService } from '@/api/dictApi'
  import {
    DictRecord,
    DictListParams,
    AddDictParams,
    EditDictParams,
    EditDictTypeParams
  } from '@/api/model/dictModel'

  // 加载状态
  const loading = ref(false)

  // 字典数据列表
  const dictList = ref<DictRecord[]>([])

  // 列配置
  const columns = reactive([
    { name: '字典类型', show: true },
    { name: '标签名', show: true },
    { name: '数据值', show: true },
    { name: '描述', show: true },
    { name: '排序', show: false },
    { name: '创建时间', show: false },
    { name: '更新时间', show: false },
    { name: '操作', show: true }
  ])

  // 查询参数
  const queryParams = reactive<DictListParams>({
    page: 1,
    limit: 10,
    type: '',
    value: '',
    label: '',
    description: '',
    sortByCreateDateAsc: false,
    sortBySortAsc: true
  })

  // 分页信息
  const pagination = reactive({
    current: 1,
    size: 10,
    total: 0,
    pages: 0
  })

  // 对话框控制
  const dialogVisible = ref(false)
  const isEdit = ref(false)
  const submitLoading = ref(false)
  const dictFormRef = ref<FormInstance>()
  const typeDisabled = ref(false)

  // 编辑类型对话框
  const typeDialogVisible = ref(false)
  const typeFormRef = ref<FormInstance>()
  const typeFormData = reactive<EditDictTypeParams>({
    oldType: '',
    newType: ''
  })

  // 类型表单校验规则
  const typeRules = reactive<FormRules>({
    newType: [{ required: true, message: '请输入新的字典类型', trigger: 'blur' }]
  })

  // 表单数据
  const formData = reactive<AddDictParams & { id?: number }>({
    type: '',
    label: '',
    value: '',
    description: '',
    sort: 0
  })

  // 表单验证规则
  const rules = reactive<FormRules>({
    type: [{ required: true, message: '请输入字典类型', trigger: 'blur' }],
    label: [{ required: true, message: '请输入标签名', trigger: 'blur' }],
    value: [{ required: true, message: '请输入数据值', trigger: 'blur' }]
  })

  // 加载字典列表数据
  const loadDictList = async () => {
    loading.value = true
    try {
      const res = await DictService.getDictList(queryParams)
      if (res.success) {
        dictList.value = res.data.records
        pagination.total = res.data.total
        pagination.current = res.data.current
        pagination.size = res.data.size
        pagination.pages = res.data.pages
      } else {
        ElMessage.error(res.message || '获取字典列表失败')
      }
    } catch (error) {
      console.error('获取字典列表失败:', error)
      ElMessage.error('获取字典列表时发生错误')
    } finally {
      loading.value = false
    }
  }

  // 搜索
  const search = () => {
    queryParams.page = 1 // 搜索时重置为第一页
    loadDictList()
  }

  // 重置查询
  const resetQuery = () => {
    queryParams.type = ''
    queryParams.value = ''
    queryParams.label = ''
    queryParams.description = ''
    queryParams.page = 1
    queryParams.limit = 10
    queryParams.sortByCreateDateAsc = false
    queryParams.sortBySortAsc = true
    loadDictList()
  }

  // 列显示设置
  const changeColumn = (list: any) => {
    Object.assign(columns, list)
  }

  // 处理分页变化
  const handleCurrentChange = (page: number) => {
    queryParams.page = page
    loadDictList()
  }

  // 处理每页显示数量变化
  const handleSizeChange = (size: number) => {
    queryParams.limit = size
    queryParams.page = 1 // 切换每页数量时重置为第一页
    loadDictList()
  }

  // 处理新增字典
  const handleAdd = () => {
    isEdit.value = false
    dialogVisible.value = true
    typeDisabled.value = false

    // 重置表单数据
    Object.assign(formData, {
      id: undefined,
      type: '',
      label: '',
      value: '',
      description: '',
      sort: 0
    })
  }

  // 处理根据类型添加字典
  const handleAddByType = (row: DictRecord) => {
    isEdit.value = false
    dialogVisible.value = true
    typeDisabled.value = true

    // 重置表单数据，但保留类型
    Object.assign(formData, {
      id: undefined,
      type: row.type,
      label: '',
      value: '',
      description: '',
      sort: 0
    })
  }

  // 处理编辑字典
  const handleEdit = (row: DictRecord) => {
    isEdit.value = true
    dialogVisible.value = true
    typeDisabled.value = true

    // 填充表单数据
    Object.assign(formData, {
      id: row.id,
      type: row.type || '',
      label: row.label || '',
      value: row.value || '',
      description: row.description || '',
      sort: row.sort || 0
    })
  }

  // 处理编辑字典类型
  const handleEditType = (row: DictRecord) => {
    typeDialogVisible.value = true

    // 填充表单数据
    typeFormData.oldType = row.type || ''
    typeFormData.newType = ''
  }

  // 处理删除字典
  const handleDelete = (row: DictRecord) => {
    ElMessageBox.confirm('确认删除该字典吗？此操作不可恢复！', '删除确认', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        try {
          const res = await DictService.deleteDict(row.id)
          if (res.success) {
            ElMessage.success('删除成功')
            loadDictList() // 重新加载数据
          } else {
            ElMessage.error(res.message || '删除失败')
          }
        } catch (error) {
          console.error('删除字典失败:', error)
          ElMessage.error('删除字典时发生错误')
        }
      })
      .catch(() => {
        // 用户取消删除，不做处理
      })
  }

  // 提交类型表单
  const submitTypeForm = async () => {
    if (!typeFormRef.value) return

    await typeFormRef.value.validate(async (valid) => {
      if (valid) {
        submitLoading.value = true

        try {
          const res = await DictService.editDictType(typeFormData)

          if (res.success) {
            ElMessage.success('字典类型更新成功')
            typeDialogVisible.value = false
            loadDictList() // 重新加载数据
          } else {
            ElMessage.error(res.message || '操作失败')
          }
        } catch (error) {
          console.error('更新字典类型失败:', error)
          ElMessage.error('更新字典类型时发生错误')
        } finally {
          submitLoading.value = false
        }
      }
    })
  }

  // 提交表单
  const submitForm = async () => {
    if (!dictFormRef.value) return

    await dictFormRef.value.validate(async (valid) => {
      if (valid) {
        submitLoading.value = true

        try {
          let res

          if (isEdit.value && formData.id !== undefined) {
            // 编辑
            const params: EditDictParams = {
              id: formData.id,
              type: formData.type,
              label: formData.label,
              value: formData.value,
              description: formData.description,
              sort: formData.sort
            }

            res = await DictService.updateDict(params)
          } else {
            // 新增
            const params: AddDictParams = {
              type: formData.type,
              label: formData.label,
              value: formData.value,
              description: formData.description,
              sort: formData.sort
            }

            res = await DictService.addDict(params)
          }

          if (res.success) {
            ElMessage.success(isEdit.value ? '编辑成功' : '新增成功')
            dialogVisible.value = false
            loadDictList() // 重新加载数据
          } else {
            ElMessage.error(res.message || '操作失败')
          }
        } catch (error) {
          console.error(isEdit.value ? '编辑失败:' : '新增失败:', error)
          ElMessage.error(isEdit.value ? '编辑时发生错误' : '新增时发生错误')
        } finally {
          submitLoading.value = false
        }
      }
    })
  }

  // 组件挂载时加载数据
  onMounted(() => {
    loadDictList()
  })
</script>

<style lang="scss" scoped>
  .page-content {
    width: 100%;
    height: 100%;
  }

  .dict-form {
    .el-input-number {
      width: 100%;
    }
  }
</style>
