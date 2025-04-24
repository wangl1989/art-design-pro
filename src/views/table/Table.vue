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
            <el-col :xs="19" :sm="12" :lg="8">
              <el-form-item label="数据库名称:">
                <el-select
                  v-model="queryParams.schemaName"
                  placeholder="请选择数据库名称"
                  style="width: 260px !important"
                  @change="handleSchemaChange"
                >
                  <el-option
                    v-for="item in schemaNameList"
                    :key="item"
                    :label="item"
                    :value="item"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="19" :sm="12" :lg="8">
              <el-form-item label="表格名称:">
                <el-input
                  v-model="queryParams.tableName"
                  placeholder="请输入表格名称搜索"
                ></el-input>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </template>
      <template #bottom>
        <el-button type="primary" @click="handleAdd" v-ripple>新增表格</el-button>
        <el-button type="danger" @click="handleBatchDelete" v-ripple>批量删除</el-button>
      </template>
    </table-bar>

    <art-table
      :data="tableList"
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
      <el-table-column label="表格名称" prop="name" min-width="150" v-if="columns[0].show" />
      <el-table-column label="表格注释" prop="comment" min-width="180" v-if="columns[1].show" />
      <el-table-column label="表格类型" prop="tableType" min-width="120" v-if="columns[2].show">
        <template #default="scope">
          <el-tag>{{ getTableTypeText(scope.row.tableType) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column
        label="数据库名称"
        prop="schemaName"
        min-width="150"
        v-if="columns[3].show"
      />
      <el-table-column label="数据量" prop="tableRows" min-width="100" v-if="columns[4].show" />
      <el-table-column label="创建时间" prop="createTime" min-width="170" v-if="columns[5].show">
        <template #default="scope">
          {{ formatDate(scope.row.createTime) }}
        </template>
      </el-table-column>
      <el-table-column label="更新时间" prop="updateTime" min-width="170" v-if="columns[6].show">
        <template #default="scope">
          {{ formatDate(scope.row.updateTime) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" fixed="right" width="220" v-if="columns[7].show">
        <template #default="scope">
          <el-button type="primary" link @click="handleEdit(scope.row)"> 编辑 </el-button>
          <el-button type="info" link @click="handleManageFields(scope.row)"> 管理字段 </el-button>
          <el-button type="danger" link @click="handleDelete(scope.row)"> 删除 </el-button>
        </template>
      </el-table-column>
    </art-table>

    <!-- 添加/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '新增表格' : '编辑表格'"
      width="800px"
      :close-on-click-modal="false"
      :destroy-on-close="true"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
        label-position="right"
      >
        <el-form-item label="数据库名称" prop="schemaName">
          <el-select
            v-model="formData.schemaName"
            placeholder="请选择数据库名称"
            filterable
            clearable
            style="width: 100%"
            :disabled="dialogType === 'edit'"
          >
            <el-option v-for="item in schemaNameList" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="表格名称" prop="tableName">
          <el-input v-model="formData.tableName" placeholder="请输入表格名称" />
        </el-form-item>
        <el-form-item label="表格注释" prop="comment">
          <el-input v-model="formData.comment" placeholder="请输入表格注释" />
        </el-form-item>
        <el-form-item label="表格类型" prop="tableType">
          <el-select
            v-model="formData.tableType"
            placeholder="请选择表格类型"
            style="width: 100%"
            :disabled="dialogType === 'edit'"
          >
            <el-option label="基本类型" :value="1" />
            <el-option label="树结构类型" :value="2" />
            <el-option label="关联类型" :value="3" />
          </el-select>
        </el-form-item>

        <!-- 只有新增表格时才需要字段列表 -->
        <template v-if="dialogType === 'add'">
          <el-divider content-position="center">字段设置</el-divider>
          <div class="field-header">
            <div style="flex: 1">
              <el-button type="primary" link @click="addFieldRow">
                <el-icon><Plus /></el-icon> 添加字段
              </el-button>
            </div>
          </div>

          <el-table :data="formData.fieldList" border stripe class="field-table">
            <el-table-column label="字段名称" min-width="150">
              <template #default="scope">
                <el-form-item
                  :prop="`fieldList.${scope.$index}.columnName`"
                  :rules="[
                    { required: true, message: '请输入字段名称', trigger: 'blur' },
                    { max: 64, message: '长度不能超过64个字符', trigger: 'blur' }
                  ]"
                  class="no-margin"
                >
                  <el-input v-model="scope.row.columnName" placeholder="请输入字段名称" />
                </el-form-item>
              </template>
            </el-table-column>
            <el-table-column label="字段类型" min-width="150">
              <template #default="scope">
                <el-form-item
                  :prop="`fieldList.${scope.$index}.type`"
                  :rules="[{ required: true, message: '请选择字段类型', trigger: 'change' }]"
                  class="no-margin"
                >
                  <el-select
                    v-model="scope.row.type"
                    placeholder="请选择字段类型"
                    style="width: 100%"
                  >
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
              </template>
            </el-table-column>
            <el-table-column label="字段长度" min-width="100">
              <template #default="scope">
                <el-form-item
                  :prop="`fieldList.${scope.$index}.length`"
                  :rules="[
                    { type: 'number', message: '长度必须为数字', trigger: 'blur' },
                    {
                      required: needLength(scope.row.type),
                      message: '请输入字段长度',
                      trigger: 'blur'
                    }
                  ]"
                  class="no-margin"
                >
                  <el-input-number
                    v-model="scope.row.length"
                    placeholder="请输入长度"
                    style="width: 100%"
                    :min="1"
                    :disabled="!needLength(scope.row.type)"
                  />
                </el-form-item>
              </template>
            </el-table-column>
            <el-table-column label="允许为空" min-width="100">
              <template #default="scope">
                <el-form-item :prop="`fieldList.${scope.$index}.isNullable`" class="no-margin">
                  <el-select
                    v-model="scope.row.isNullable"
                    placeholder="是否可空"
                    style="width: 100%"
                  >
                    <el-option label="是" value="YES" />
                    <el-option label="否" value="NO" />
                  </el-select>
                </el-form-item>
              </template>
            </el-table-column>
            <el-table-column label="字段注释" min-width="200">
              <template #default="scope">
                <el-form-item :prop="`fieldList.${scope.$index}.comment`" class="no-margin">
                  <el-input v-model="scope.row.comment" placeholder="请输入字段注释" />
                </el-form-item>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80">
              <template #default="scope">
                <el-button
                  type="danger"
                  link
                  @click="removeFieldRow(scope.$index)"
                  :disabled="formData.fieldList.length <= 1"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </template>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitLoading">确定</el-button>
      </template>
    </el-dialog>

    <!-- 添加TableField对话框组件 -->
    <TableField
      v-if="showTableField"
      v-model:visible="showTableField"
      :tableName="tableFieldInfo.tableName"
      :schemaName="tableFieldInfo.schemaName"
      :tableType="tableFieldInfo.tableType"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, onMounted } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { Plus } from '@element-plus/icons-vue'
  import { TableService as TableConfigService } from '@/api/tableConfigApi'
  import { TableService } from '@/api/tableApi'
  import {
    TableRecordModel,
    TableListParam,
    AddTableParam,
    EditTableParam,
    AddListTableFieldParam
  } from '@/api/model/tableModel'
  import type { FormInstance, FormRules } from 'element-plus'
  import { formatDate } from '@/utils/date'
  // 引入TableField组件
  import TableField from './TableField.vue'

  // 加载状态
  const loading = ref(false)
  const submitLoading = ref(false)

  // 添加TableField对话框相关状态变量
  const showTableField = ref(false)
  const tableFieldInfo = reactive({
    tableName: '',
    schemaName: '',
    tableType: 1
  })

  // 表格数据列表
  const tableList = ref<TableRecordModel[]>([])

  // 下拉列表数据
  const schemaNameList = ref<string[]>([])

  // 选中的表格记录
  const selectedTables = ref<TableRecordModel[]>([])

  // 列配置
  const columns = reactive([
    { name: '表格名称', show: true },
    { name: '表格注释', show: true },
    { name: '表格类型', show: true },
    { name: '数据库名称', show: true },
    { name: '数据量', show: true },
    { name: '创建时间', show: true },
    { name: '更新时间', show: true },
    { name: '操作', show: true }
  ])

  // 查询参数
  const queryParams = reactive<TableListParam>({
    page: 1,
    limit: 10,
    schemaName: '',
    tableName: ''
  })

  // 分页信息
  const pagination = reactive({
    current: 1,
    size: 10,
    total: 0
  })

  // 对话框相关
  const dialogVisible = ref(false)
  const dialogType = ref<'add' | 'edit'>('add')
  const formRef = ref<FormInstance>()

  // 表单数据
  const formData = reactive<AddTableParam & { oldTableName?: string }>({
    schemaName: '',
    tableName: '',
    comment: '',
    tableType: 1,
    fieldList: [createListField()]
  })

  // 创建默认字段
  function createListField(): AddListTableFieldParam {
    return {
      columnName: '',
      length: 50,
      type: 'varchar',
      isNullable: false,
      comment: ''
    }
  }

  // 是否需要长度字段
  const needLength = (type: string): boolean => {
    return ['varchar', 'int', 'bigint', 'tinyint', 'decimal', 'double'].includes(type || '')
  }

  // 表单验证规则
  const formRules = reactive<FormRules>({
    schemaName: [{ required: true, message: '请选择数据库名称', trigger: 'change' }],
    tableName: [
      { required: true, message: '请输入表格名称', trigger: 'blur' },
      { max: 64, message: '长度不能超过64个字符', trigger: 'blur' }
    ],
    tableType: [{ required: true, message: '请选择表格类型', trigger: 'change' }]
  })

  // 加载表格列表数据
  const loadTableList = async () => {
    loading.value = true
    try {
      const res = await TableService.getTableList(queryParams)
      if (res.success) {
        tableList.value = res.data.records
        pagination.total = res.data.total
        pagination.current = res.data.current
        pagination.size = res.data.size
      } else {
        ElMessage.error(res.message || '获取表格列表失败')
      }
    } catch (error) {
      console.error('获取表格列表失败:', error)
      ElMessage.error('获取表格列表时发生错误')
    } finally {
      loading.value = false
    }
  }

  // 搜索
  const search = () => {
    queryParams.page = 1 // 搜索时重置为第一页
    loadTableList()
  }

  // 重置查询
  const resetQuery = () => {
    queryParams.tableName = ''
    queryParams.page = 1
    queryParams.limit = 10
    loadTableList()
  }

  // 列显示设置
  const changeColumn = (list: any) => {
    Object.assign(columns, list)
  }

  // 监听选中行变化
  const handleSelectionChange = (selection: TableRecordModel[]) => {
    selectedTables.value = selection
  }

  // 处理分页变化
  const handleCurrentChange = (page: number) => {
    queryParams.page = page
    loadTableList()
  }

  // 处理每页显示数量变化
  const handleSizeChange = (size: number) => {
    queryParams.limit = size
    queryParams.page = 1 // 切换每页数量时重置为第一页
    loadTableList()
  }

  // 获取数据库名称列表
  const getSchemaNameList = async () => {
    try {
      const res = await TableConfigService.getSchemaNameList()
      if (res.success && res.data) {
        schemaNameList.value = res.data
        // 如果当前没有选择数据库，且有数据库列表，则默认选择第一个
        if (!queryParams.schemaName && res.data.length > 0) {
          queryParams.schemaName = res.data[0]
          // 使用选择的数据库名称加载表格列表
          loadTableList()
        }
      } else {
        ElMessage.error(res.message || '获取数据库名称列表失败')
      }
    } catch (error) {
      console.error('获取数据库名称列表失败:', error)
      ElMessage.error('获取数据库名称列表时发生错误')
    }
  }

  // 处理数据库名称变更
  const handleSchemaChange = () => {
    loadTableList()
  }

  // 处理添加字段行
  const addFieldRow = () => {
    formData.fieldList.push(createListField())
  }

  // 处理移除字段行
  const removeFieldRow = (index: number) => {
    if (formData.fieldList.length > 1) {
      formData.fieldList.splice(index, 1)
    }
  }

  // 处理添加表格
  const handleAdd = () => {
    dialogType.value = 'add'
    resetForm()
    dialogVisible.value = true
  }

  // 处理编辑表格
  const handleEdit = (row: TableRecordModel) => {
    dialogType.value = 'edit'
    resetForm()
    // 复制数据到表单
    formData.schemaName = row.schemaName
    formData.tableName = row.name
    formData.oldTableName = row.name // 保存旧表名
    formData.comment = row.comment
    formData.tableType = row.tableType
    // 编辑模式下不需要字段列表
    formData.fieldList = []

    dialogVisible.value = true
  }

  // 重置表单
  const resetForm = () => {
    formData.schemaName = ''
    formData.tableName = ''
    formData.oldTableName = ''
    formData.comment = ''
    formData.tableType = 1
    formData.fieldList = [createListField()]

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

          // 处理字段列表中的表名和数据库名
          if (dialogType.value === 'add') {
            // 新增表格时无需特殊处理字段数据
            // 每个字段行已经有自己的数据，可以直接使用
            // 用户通过addFieldRow方法添加的字段行会自动加入到formData.fieldList集合中

            res = await TableService.addTable(formData)
          } else {
            // 编辑表格，不包含字段列表
            const editParams: EditTableParam = {
              schemaName: formData.schemaName,
              oldTableName: formData.oldTableName || '',
              tableName: formData.tableName,
              comment: formData.comment,
              tableType: formData.tableType
            }
            res = await TableService.editTable(editParams)
          }

          if (res.success) {
            ElMessage.success(dialogType.value === 'add' ? '添加成功' : '编辑成功')
            dialogVisible.value = false
            loadTableList() // 重新加载数据
          } else {
            ElMessage.error(res.message || (dialogType.value === 'add' ? '添加失败' : '编辑失败'))
          }
        } catch (error) {
          console.error(dialogType.value === 'add' ? '添加表格失败:' : '编辑表格失败:', error)
          ElMessage.error(dialogType.value === 'add' ? '添加表格时发生错误' : '编辑表格时发生错误')
        } finally {
          submitLoading.value = false
        }
      }
    })
  }

  // 处理批量删除
  const handleBatchDelete = () => {
    if (selectedTables.value.length === 0) {
      ElMessage.warning('请至少选择一条记录')
      return
    }

    ElMessageBox.confirm(
      '确定要删除选中的表格吗？此操作会删除表及其所有数据，且不可恢复！',
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
      .then(async () => {
        const deletePromises = selectedTables.value.map((table) =>
          TableService.deleteTable({ tableName: table.name })
        )

        try {
          const results = await Promise.all(deletePromises)
          const success = results.every((res) => res.success)

          if (success) {
            ElMessage.success('批量删除成功')
            loadTableList() // 重新加载数据
          } else {
            ElMessage.error('部分或全部删除失败，请重试')
          }
        } catch (error) {
          console.error('批量删除表格失败:', error)
          ElMessage.error('批量删除表格时发生错误')
        }
      })
      .catch(() => {
        // 用户取消操作
      })
  }

  // 处理单个删除
  const handleDelete = (row: TableRecordModel) => {
    ElMessageBox.confirm(
      `确定要删除表格 "${row.name}" 吗？此操作会删除表及其所有数据，且不可恢复！`,
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
      .then(async () => {
        try {
          const res = await TableService.deleteTable({ tableName: row.name })
          if (res.success) {
            ElMessage.success('删除成功')
            loadTableList() // 重新加载数据
          } else {
            ElMessage.error(res.message || '删除失败')
          }
        } catch (error) {
          console.error('删除表格失败:', error)
          ElMessage.error('删除表格时发生错误')
        }
      })
      .catch(() => {
        // 用户取消操作
      })
  }

  // 处理管理字段
  const handleManageFields = (row: TableRecordModel) => {
    // 设置要传递给TableField组件的信息
    tableFieldInfo.tableName = row.name
    tableFieldInfo.schemaName = row.schemaName
    tableFieldInfo.tableType = row.tableType

    // 显示TableField对话框
    showTableField.value = true
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

  // 组件挂载时加载数据
  onMounted(() => {
    getSchemaNameList()
  })
</script>

<style lang="scss" scoped>
  .page-content {
    width: 100%;
    height: 100%;
  }

  .field-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  .field-table {
    margin-bottom: 20px;
  }

  :deep(.el-form-item.no-margin) {
    margin-bottom: 0;
  }
</style>
