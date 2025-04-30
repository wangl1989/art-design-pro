<template>
  <el-dialog
    v-model="dialogVisible"
    :title="`表格字段管理 - ${tableInfo.tableName}`"
    width="90%"
    :append-to-body="true"
    :destroy-on-close="false"
    fullscreen
    @closed="handleClose"
  >
    <div class="page-content">
      <div class="header-info-card">
        <div class="header-info">
          <div class="info-item">
            <span class="info-label">表名称:</span>
            <span class="info-value">{{ tableInfo.tableName }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">数据库名称:</span>
            <span class="info-value">{{ tableInfo.schemaName }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">表类型:</span>
            <span class="info-value">
              <el-tag size="small">{{ getTableTypeText(tableInfo.tableType) }}</el-tag>
            </span>
          </div>
        </div>
      </div>

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
              <el-col :xs="19" :sm="12" :lg="8">
                <el-form-item label="字段名称">
                  <el-input
                    v-model="queryParams.columnName"
                    placeholder="请输入字段名称搜索"
                  ></el-input>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </template>
        <template #bottom>
          <el-button type="primary" @click="handleAdd" v-ripple>新增字段</el-button>
          <el-button type="danger" @click="handleBatchDelete" v-ripple>批量删除</el-button>
        </template>
      </table-bar>

      <art-table
        :data="fieldList"
        selection
        v-loading="loading"
        pagination
        :currentPage="pagination.current"
        :pageSize="pagination.size"
        :total="pagination.total"
        @current-change="handleCurrentChange"
        @size-change="handleSizeChange"
        @selection-change="handleSelectionChange"
      >
        <el-table-column
          label="字段名称"
          prop="columnName"
          min-width="150"
          v-if="columns[0].show"
        />
        <el-table-column label="字段长度" prop="length" min-width="100" v-if="columns[1].show" />
        <el-table-column label="字段类型" prop="type" min-width="120" v-if="columns[2].show" />
        <el-table-column
          label="不允许为空"
          prop="isNullable"
          min-width="120"
          v-if="columns[3].show"
        >
          <template #default="scope">
            <el-tag :type="scope.row.isNullable ? 'success' : 'danger'">
              {{ scope.row.isNullable ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="字段注释" prop="comment" min-width="180" v-if="columns[4].show" />
        <el-table-column label="操作" fixed="right" width="180" v-if="columns[5].show">
          <template #default="scope">
            <el-button type="primary" link @click="handleEdit(scope.row)"> 编辑 </el-button>
            <el-button type="danger" link @click="handleDelete(scope.row)"> 删除 </el-button>
          </template>
        </el-table-column>
      </art-table>

      <!-- 添加/编辑对话框 -->
      <el-dialog
        v-model="fieldDialogVisible"
        :title="dialogType === 'add' ? '新增字段' : '编辑字段'"
        width="600px"
        :close-on-click-modal="false"
        :destroy-on-close="true"
        :append-to-body="true"
      >
        <el-form
          ref="formRef"
          :model="formData"
          :rules="formRules"
          label-width="100px"
          label-position="right"
        >
          <el-form-item label="字段名称" prop="columnName">
            <el-input
              v-model="formData.columnName"
              placeholder="请输入字段名称"
              :disabled="dialogType === 'edit'"
            />
          </el-form-item>
          <el-form-item label="字段类型" prop="type">
            <el-select v-model="formData.type" placeholder="请选择字段类型" style="width: 100%">
              <el-option label="varchar" value="varchar" />
              <el-option label="int" value="int" />
              <el-option label="bigint" value="bigint" />
              <el-option label="tinyint" value="tinyint" />
              <el-option label="double" value="double" />
              <el-option label="decimal" value="decimal" />
              <el-option label="text" value="text" />
              <el-option label="datetime" value="datetime" />
              <el-option label="date" value="date" />
              <el-option label="time" value="time" />
              <el-option label="timestamp" value="timestamp" />
              <el-option label="blob" value="blob" />
            </el-select>
          </el-form-item>
          <el-form-item label="字段长度" prop="length">
            <el-input-number
              v-model="formData.length"
              placeholder="请输入长度"
              style="width: 100%"
              :min="1"
              :disabled="!needLength(formData.type)"
            />
          </el-form-item>
          <el-form-item label="不允许为空" prop="isNullable">
            <el-switch
              v-model="formData.isNullable"
              :active-value="true"
              :inactive-value="false"
            ></el-switch>
          </el-form-item>
          <el-form-item label="字段注释" prop="comment">
            <el-input
              v-model="formData.comment"
              type="textarea"
              :rows="3"
              placeholder="请输入字段注释"
            />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="fieldDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitLoading">确定</el-button>
        </template>
      </el-dialog>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
  import { ref, reactive, watch, defineProps, defineEmits } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { TableService } from '@/api/tableApi'
  import {
    TableFieldRecordModel,
    TableFieldListParam,
    AddTableFieldParam,
    EditTableFieldParam
  } from '@/api/model/tableModel'
  import type { FormInstance, FormRules } from 'element-plus'

  // 定义属性
  const props = defineProps({
    visible: {
      type: Boolean,
      default: false
    },
    tableName: {
      type: String,
      required: true
    },
    schemaName: {
      type: String,
      required: true
    },
    tableType: {
      type: Number,
      required: true
    }
  })

  // 定义事件
  const emit = defineEmits(['update:visible'])

  // 对话框可见状态
  const dialogVisible = ref(false)

  // 表信息
  const tableInfo = reactive({
    tableName: '',
    schemaName: '',
    tableType: 1
  })

  // 加载状态
  const loading = ref(false)
  const submitLoading = ref(false)

  // 字段数据列表
  const fieldList = ref<TableFieldRecordModel[]>([])

  // 选中的字段记录
  const selectedFields = ref<TableFieldRecordModel[]>([])

  // 列配置
  const columns = reactive([
    { name: '字段名称', show: true },
    { name: '字段长度', show: true },
    { name: '字段类型', show: true },
    { name: '允许为空', show: true },
    { name: '字段注释', show: true },
    { name: '操作', show: true }
  ])

  // 查询参数
  const queryParams = reactive<TableFieldListParam>({
    page: 1,
    limit: 10,
    schemaName: '',
    tableName: '',
    tableType: 1,
    columnName: ''
  })

  // 分页信息
  const pagination = reactive({
    current: 1,
    size: 10,
    total: 0
  })

  // 对话框相关
  const fieldDialogVisible = ref(false)
  const dialogType = ref<'add' | 'edit'>('add')
  const formRef = ref<FormInstance>()

  // 表单数据
  const formData = reactive<AddTableFieldParam & { oldName?: string }>({
    schemaName: '',
    tableName: '',
    tableType: 1,
    columnName: '',
    length: 50,
    type: 'varchar',
    isNullable: false,
    comment: ''
  })

  // 初始化表信息 - 在watch前定义这个函数
  const initTableInfo = () => {
    // 从props中获取表信息
    tableInfo.tableName = props.tableName
    tableInfo.schemaName = props.schemaName
    tableInfo.tableType = props.tableType

    // 设置查询参数
    queryParams.tableName = tableInfo.tableName
    queryParams.schemaName = tableInfo.schemaName
    queryParams.tableType = tableInfo.tableType

    // 加载字段列表
    loadFieldList()
  }

  // 加载字段列表数据
  const loadFieldList = async () => {
    loading.value = true
    try {
      const res = await TableService.getFieldList(queryParams)
      if (res.success) {
        fieldList.value = res.data.records
        pagination.total = res.data.total
        pagination.current = res.data.current
        pagination.size = res.data.size
      } else {
        ElMessage.error(res.message || '获取字段列表失败')
      }
    } catch (error) {
      console.error('获取字段列表失败:', error)
      ElMessage.error('获取字段列表时发生错误')
    } finally {
      loading.value = false
    }
  }

  // 监听父组件传递的visible属性
  watch(
    () => props.visible,
    (newVal) => {
      dialogVisible.value = newVal
      if (newVal) {
        initTableInfo()
      }
    },
    { immediate: true }
  )

  // 监听对话框关闭，通知父组件更新visible
  watch(
    () => dialogVisible.value,
    (newVal) => {
      if (!newVal) {
        emit('update:visible', false)
      }
    }
  )

  // 是否需要长度字段
  const needLength = (type: string): boolean => {
    const lowerType = (type || '').toLowerCase()
    return ['varchar', 'int', 'bigint', 'tinyint', 'decimal', 'double'].includes(lowerType)
  }

  // 表单验证规则
  const formRules = reactive<FormRules>({
    columnName: [
      { required: true, message: '请输入字段名称', trigger: 'blur' },
      { max: 64, message: '长度不能超过64个字符', trigger: 'blur' }
    ],
    type: [{ required: true, message: '请选择字段类型', trigger: 'change' }],
    length: [
      {
        validator: (rule, value, callback) => {
          if (needLength(formData.type) && (!value || value <= 0)) {
            callback(new Error('请输入有效的字段长度'))
          } else {
            callback()
          }
        },
        trigger: 'blur'
      }
    ]
  })

  // 搜索
  const search = () => {
    queryParams.page = 1 // 搜索时重置为第一页
    loadFieldList()
  }

  // 重置查询
  const resetQuery = () => {
    queryParams.columnName = ''
    queryParams.page = 1
    queryParams.limit = 10
    loadFieldList()
  }

  // 列显示设置
  const changeColumn = (list: any) => {
    Object.assign(columns, list)
  }

  // 监听选中行变化
  const handleSelectionChange = (selection: TableFieldRecordModel[]) => {
    selectedFields.value = selection
  }

  // 处理分页变化
  const handleCurrentChange = (page: number) => {
    queryParams.page = page
    loadFieldList()
  }

  // 处理每页显示数量变化
  const handleSizeChange = (size: number) => {
    queryParams.limit = size
    queryParams.page = 1 // 切换每页数量时重置为第一页
    loadFieldList()
  }

  // 处理添加字段
  const handleAdd = () => {
    dialogType.value = 'add'
    resetForm()
    // 设置默认值
    formData.schemaName = tableInfo.schemaName
    formData.tableName = tableInfo.tableName
    formData.tableType = tableInfo.tableType

    fieldDialogVisible.value = true
  }

  // 处理编辑字段
  const handleEdit = (row: TableFieldRecordModel) => {
    dialogType.value = 'edit'
    resetForm()

    // 复制数据到表单
    formData.schemaName = tableInfo.schemaName
    formData.tableName = tableInfo.tableName
    formData.tableType = tableInfo.tableType
    formData.columnName = row.columnName
    formData.oldName = row.columnName // 保存旧字段名
    formData.length = row.length
    formData.type = row.type
    formData.isNullable = row.isNullable
    formData.comment = row.comment

    fieldDialogVisible.value = true
  }

  // 重置表单
  const resetForm = () => {
    formData.columnName = ''
    formData.oldName = ''
    formData.length = 50
    formData.type = 'varchar'
    formData.isNullable = false
    formData.comment = ''

    // 重置表单验证
    if (formRef.value) {
      formRef.value.resetFields()
    }
  }

  // 提交表单
  const submitForm = async () => {
    if (!formRef.value) return

    await formRef.value.validate(async (valid) => {
      if (valid) {
        submitLoading.value = true
        try {
          let res

          if (dialogType.value === 'add') {
            res = await TableService.addField(formData)
          } else {
            // 编辑字段
            const editParams: EditTableFieldParam = {
              schemaName: formData.schemaName,
              tableName: formData.tableName,
              tableType: formData.tableType,
              columnName: formData.columnName,
              length: formData.length,
              type: formData.type,
              isNullable: formData.isNullable,
              comment: formData.comment,
              oldName: formData.oldName || ''
            }
            res = await TableService.editField(editParams)
          }

          if (res.success) {
            ElMessage.success(dialogType.value === 'add' ? '添加成功' : '编辑成功')
            fieldDialogVisible.value = false
            loadFieldList() // 重新加载数据
          } else {
            ElMessage.error(res.message || (dialogType.value === 'add' ? '添加失败' : '编辑失败'))
          }
        } catch (error) {
          console.error(dialogType.value === 'add' ? '添加字段失败:' : '编辑字段失败:', error)
          ElMessage.error(dialogType.value === 'add' ? '添加字段时发生错误' : '编辑字段时发生错误')
        } finally {
          submitLoading.value = false
        }
      }
    })
  }

  // 处理批量删除
  const handleBatchDelete = () => {
    if (selectedFields.value.length === 0) {
      ElMessage.warning('请至少选择一个字段')
      return
    }

    ElMessageBox.confirm('确定要删除选中的字段吗？此操作不可恢复！', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        const deletePromises = selectedFields.value.map((field) =>
          TableService.deleteField({
            tableName: tableInfo.tableName,
            fieldName: field.columnName
          })
        )

        try {
          const results = await Promise.all(deletePromises)
          const success = results.every((res) => res.success)

          if (success) {
            ElMessage.success('批量删除成功')
            loadFieldList() // 重新加载数据
          } else {
            ElMessage.error('部分或全部删除失败，请重试')
          }
        } catch (error) {
          console.error('批量删除字段失败:', error)
          ElMessage.error('批量删除字段时发生错误')
        }
      })
      .catch(() => {
        // 用户取消操作
      })
  }

  // 处理单个删除
  const handleDelete = (row: TableFieldRecordModel) => {
    ElMessageBox.confirm(`确定要删除字段 "${row.columnName}" 吗？此操作不可恢复！`, '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        try {
          const res = await TableService.deleteField({
            tableName: tableInfo.tableName,
            fieldName: row.columnName
          })
          if (res.success) {
            ElMessage.success('删除成功')
            loadFieldList() // 重新加载数据
          } else {
            ElMessage.error(res.message || '删除失败')
          }
        } catch (error) {
          console.error('删除字段失败:', error)
          ElMessage.error('删除字段时发生错误')
        }
      })
      .catch(() => {
        // 用户取消操作
      })
  }

  // 获取表格类型对应的文本
  const getTableTypeText = (typeCode: number): string => {
    const map: Record<number, string> = {
      1: '基本类型',
      2: '树结构类型',
      3: '关联类型'
    }
    return map[typeCode] || `未知类型(${typeCode})`
  }

  // 对话框关闭处理函数
  const handleClose = () => {
    emit('update:visible', false)
  }
</script>

<style lang="scss" scoped>
  .page-content {
    width: 100%;
    height: 100%;
  }

  .header-info-card {
    padding: 20px;
    margin-bottom: 20px;
    background: linear-gradient(to right, #f8f9fa, #fff);
    border-left: 4px solid #4c84ff;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgb(0 0 0 / 5%);
  }

  .header-info {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    font-size: 14px;

    .info-item {
      display: flex;
      align-items: center;

      .info-label {
        margin-right: 10px;
        font-weight: 500;
        color: #606266;
      }

      .info-value {
        display: inline-flex;
        align-items: center;
        font-weight: bold;
        color: #303133;
      }
    }
  }
</style>
