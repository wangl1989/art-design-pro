<template>
  <div class="page-content">
    <table-bar
      ref="tableBarRef"
      :showTop="false"
      @search="search"
      @reset="resetQuery"
      @changeColumn="changeColumn"
      :columns="columns"
    >
      <template #top>
        <el-form
          :model="queryParams"
          ref="searchFormRef"
          inline
          label-width="80px"
          class="compact-form"
        >
          <el-row :gutter="0">
            <el-col :span="5">
              <el-form-item label="表格名称:">
                <el-input
                  v-model="queryParams.tableName"
                  placeholder="请输入表格名称搜索"
                  style="width: 180px"
                ></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="5">
              <el-form-item label="数据库名:">
                <el-input
                  v-model="queryParams.schemaName"
                  placeholder="请输入数据库名称搜索"
                  style="width: 180px"
                ></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="5">
              <el-form-item label="业务名称:">
                <el-input
                  v-model="queryParams.businessName"
                  placeholder="请输入业务名称搜索"
                  style="width: 180px"
                ></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="5">
              <el-form-item label="配置状态:">
                <el-select
                  v-model="queryParams.delFlag"
                  placeholder="请选择配置状态"
                  clearable
                  style="width: 180px"
                >
                  <el-option label="正常" :value="false"></el-option>
                  <el-option label="已删除" :value="true"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="4" class="search-buttons">
              <el-button type="primary" @click="search" v-ripple>搜索</el-button>
              <el-button @click="resetQuery" v-ripple>重置</el-button>
            </el-col>
          </el-row>
        </el-form>
      </template>
      <template #search-buttons>
        <!-- 这里故意留空，按钮已经移到表单内部 -->
      </template>
      <template #bottom>
        <el-button type="primary" @click="handleAdd" v-auth="'tableconfig_add'" v-ripple
          >新增表格配置</el-button
        >
        <el-button
          type="danger"
          @click="handleBatchDelete"
          v-auth="'tableconfig_batch_delete'"
          v-ripple
          >批量删除</el-button
        >
        <el-button
          type="success"
          @click="handleDownloadCode"
          v-auth="'tableconfig_download'"
          v-ripple
          >下载源码</el-button
        >
      </template>
    </table-bar>

    <art-table
      :data="tableConfigList"
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
      <el-table-column label="表格类型" prop="tableType" v-if="columns[0].show">
        <template #default="scope">
          <el-tag>{{ getTableTypeText(scope.row.tableType) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="表格名称" prop="tableName" v-if="columns[1].show" />
      <el-table-column label="表格前缀" prop="tablePrefix" v-if="columns[2].show" />
      <el-table-column label="数据库名称" prop="schemaName" v-if="columns[3].show" />
      <el-table-column label="业务名称" prop="businessName" v-if="columns[4].show" />
      <el-table-column label="模块名称" prop="moduleName" v-if="columns[5].show" />
      <el-table-column label="包名称" prop="packageName" v-if="columns[6].show" />
      <el-table-column label="作者" prop="author" v-if="columns[7].show" />
      <el-table-column label="生成路径" prop="generatePath" v-if="columns[8].show" />
      <el-table-column label="可配置字段" prop="fieldCount" v-if="columns[9].show">
        <template #default="scope">
          <div v-if="scope.row.fieldCount > 0">
            <el-button
              type="primary"
              link
              v-auth="'tableconfig_config_field'"
              @click="openFieldConfig(scope.row)"
            >
              共 {{ scope.row.fieldCount }} 个字段
            </el-button>
          </div>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="备注" prop="remarks" v-if="columns[10].show" />
      <el-table-column label="更新时间" prop="updateDate" v-if="columns[11].show">
        <template #default="scope">
          {{ formatDate(scope.row.updateDate) }}
        </template>
      </el-table-column>
      <el-table-column label="状态" prop="delFlag" v-if="columns[12].show">
        <template #default="scope">
          <el-tag :type="scope.row.delFlag ? 'danger' : 'success'">
            {{ scope.row.delFlag ? '已删除' : '正常' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" fixed="right" width="220" v-if="columns[13].show">
        <template #default="scope">
          <el-button
            type="primary"
            link
            v-auth="'tableconfig_edit'"
            @click="handleEdit(scope.row)"
            v-if="!scope.row.delFlag"
          >
            编辑
          </el-button>
          <el-button
            type="info"
            link
            v-auth="'tableconfig_sync_field'"
            @click="handleSyncFields(scope.row)"
            v-if="!scope.row.delFlag"
          >
            同步字段
          </el-button>
          <el-button
            type="danger"
            link
            v-auth="'tableconfig_delete'"
            @click="handleDelete(scope.row)"
            v-if="!scope.row.delFlag"
          >
            删除
          </el-button>
          <el-button
            type="success"
            link
            v-auth="'tableconfig_recover'"
            @click="handleRecover(scope.row)"
            v-if="scope.row.delFlag"
          >
            恢复
          </el-button>
        </template>
      </el-table-column>
    </art-table>

    <!-- 添加/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '新增表格配置' : '编辑表格配置'"
      width="580px"
      :close-on-click-modal="false"
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
            @change="handleSchemaChange"
            style="width: 100%"
          >
            <el-option v-for="item in schemaNameList" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="表格名称" prop="tableName">
          <el-select
            v-model="formData.tableName"
            placeholder="请选择表格名称"
            filterable
            clearable
            style="width: 100%"
            :disabled="!formData.schemaName"
          >
            <el-option v-for="item in tableNameList" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="表格前缀" prop="tablePrefix">
          <el-input v-model="formData.tablePrefix" placeholder="请输入表格前缀" />
        </el-form-item>
        <el-form-item label="业务名称" prop="businessName">
          <el-input v-model="formData.businessName" placeholder="请输入业务名称" />
        </el-form-item>
        <el-form-item label="模块名称" prop="moduleName">
          <el-input v-model="formData.moduleName" placeholder="请输入模块名称" />
        </el-form-item>
        <el-form-item label="包名称" prop="packageName">
          <el-input v-model="formData.packageName" placeholder="请输入包名称" />
        </el-form-item>
        <el-form-item label="作者" prop="author">
          <el-input v-model="formData.author" placeholder="请输入作者" />
        </el-form-item>
        <el-form-item label="生成路径" prop="generatePath">
          <el-input v-model="formData.generatePath" placeholder="请输入生成路径" />
        </el-form-item>
        <el-form-item label="选项" prop="options">
          <el-input
            v-model="formData.options"
            type="textarea"
            :rows="3"
            placeholder="请输入选项，如JSON格式配置"
          />
        </el-form-item>
        <el-form-item label="备注" prop="remarks">
          <el-input
            v-model="formData.remarks"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitLoading">确定</el-button>
      </template>
    </el-dialog>

    <!-- 字段配置组件 -->
    <TableFieldConfig
      :visible="showFieldConfig"
      @update:visible="showFieldConfig = $event"
      :tableConfig="currentTableConfig"
      :fieldList="fieldList"
      :loading="fieldListLoading"
      @refresh="refreshTableData"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, onMounted } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { TableService } from '@/api/tableConfigApi'
  import {
    TableConfigModel,
    TableConfigListParams,
    BaseTableConfig,
    TableTypeTextMap,
    SyncTableFieldListParams,
    TableFieldConfigModel
  } from '@/api/model/tableConfigModel'
  import type { FormInstance, FormRules } from 'element-plus'
  import { formatDate } from '@/utils/date'
  import TableFieldConfig from './TableFieldConfig.vue'
  import FileSaver from 'file-saver'

  // 表格栏引用
  const tableBarRef = ref()
  // 搜索表单引用
  const searchFormRef = ref<FormInstance>()

  // 加载状态
  const loading = ref(false)
  const submitLoading = ref(false)

  // 表格配置数据列表
  const tableConfigList = ref<TableConfigModel[]>([])

  // 下拉列表数据
  const schemaNameList = ref<string[]>([])
  const tableNameList = ref<string[]>([])

  // 选中的表格配置记录
  const selectedConfigs = ref<TableConfigModel[]>([])

  // 当前选中的表格配置和字段列表(用于字段管理)
  const currentTableConfig = ref<TableConfigModel | undefined>(undefined)
  const fieldList = ref<TableFieldConfigModel[]>([])
  // 字段配置对话框显示状态和加载状态
  const showFieldConfig = ref(false)
  const fieldListLoading = ref(false)

  // 列配置
  const columns = reactive([
    { name: '表格类型', show: true },
    { name: '表格名称', show: true },
    { name: '表格前缀', show: false },
    { name: '数据库名称', show: true },
    { name: '业务名称', show: true },
    { name: '模块名称', show: false },
    { name: '包名称', show: false },
    { name: '作者', show: true },
    { name: '生成路径', show: false },
    { name: '可配置字段', show: true },
    { name: '备注', show: true },
    { name: '更新时间', show: true },
    { name: '状态', show: false },
    { name: '操作', show: true }
  ])

  // 查询参数
  const queryParams = reactive<TableConfigListParams>({
    page: 1,
    limit: 10,
    tableName: '',
    schemaName: '',
    businessName: '',
    delFlag: false,
    sortByUpdateDateAsc: false
  })

  // 分页信息
  const pagination = reactive({
    current: 1,
    size: 10,
    total: 0,
    pages: 0
  })

  // 对话框相关
  const dialogVisible = ref(false)
  const dialogType = ref<'add' | 'edit'>('add')
  const formRef = ref<FormInstance>()

  // 表单数据
  const formData = reactive<BaseTableConfig & { id?: number }>({
    tableName: '',
    tablePrefix: '',
    schemaName: '',
    businessName: '',
    moduleName: '',
    packageName: '',
    author: '',
    generatePath: '',
    options: '',
    remarks: ''
  })

  // 表单验证规则
  const formRules = reactive<FormRules>({
    tableName: [
      { required: true, message: '请输入表格名称', trigger: 'blur' },
      { max: 100, message: '长度不能超过100个字符', trigger: 'blur' }
    ],
    tablePrefix: [{ max: 30, message: '长度不能超过30个字符', trigger: 'blur' }],
    schemaName: [
      { required: true, message: '请输入数据库名称', trigger: 'blur' },
      { max: 100, message: '长度不能超过100个字符', trigger: 'blur' }
    ],
    businessName: [
      { required: true, message: '请输入业务名称', trigger: 'blur' },
      { max: 100, message: '长度不能超过100个字符', trigger: 'blur' }
    ]
  })

  // 加载表格配置列表数据
  const loadTableConfigList = async () => {
    loading.value = true
    try {
      const res = await TableService.getTableConfigList(queryParams)
      if (res.success) {
        tableConfigList.value = res.data.records
        pagination.total = res.data.total
        pagination.current = res.data.current
        pagination.size = res.data.size
        pagination.pages = res.data.pages
      } else {
        ElMessage.error(res.message || '获取表格配置列表失败')
      }
    } catch (error) {
      console.error('获取表格配置列表失败:', error)
      ElMessage.error('获取表格配置列表时发生错误')
    } finally {
      loading.value = false
    }
  }

  // 搜索
  const search = () => {
    queryParams.page = 1 // 搜索时重置为第一页
    loadTableConfigList()
  }

  // 重置查询
  const resetQuery = () => {
    queryParams.tableName = ''
    queryParams.schemaName = ''
    queryParams.businessName = ''
    queryParams.delFlag = false
    queryParams.page = 1
    queryParams.limit = 10
    queryParams.sortByUpdateDateAsc = false
    loadTableConfigList()
  }

  // 监听选中行变化
  const handleSelectionChange = (selection: TableConfigModel[]) => {
    selectedConfigs.value = selection
  }

  // 处理批量删除
  const handleBatchDelete = () => {
    if (selectedConfigs.value.length === 0) {
      ElMessage.warning('请至少选择一条记录')
      return
    }

    // 过滤掉已经标记为删除的记录
    const validConfigs = selectedConfigs.value.filter((config) => !config.delFlag)

    if (validConfigs.length === 0) {
      ElMessage.warning('所选记录均已被删除，请重新选择')
      return
    }

    ElMessageBox.confirm('确定要删除选中的表格配置吗？', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        const deletePromises = validConfigs.map((config) =>
          TableService.deleteTableConfig(config.id)
        )

        try {
          const results = await Promise.all(deletePromises)
          const success = results.every((res) => res.success)

          if (success) {
            ElMessage.success('批量删除成功')
            loadTableConfigList() // 重新加载数据
          } else {
            ElMessage.error('部分或全部删除失败，请重试')
          }
        } catch (error) {
          console.error('批量删除表格配置失败:', error)
          ElMessage.error('批量删除表格配置时发生错误')
        }
      })
      .catch(() => {
        // 用户取消操作
      })
  }

  // 处理单个删除
  const handleDelete = (row: TableConfigModel) => {
    ElMessageBox.confirm(`确定要删除表格配置 "${row.tableName}" 吗？`, '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        try {
          const res = await TableService.deleteTableConfig(row.id)
          if (res.success) {
            ElMessage.success('删除成功')
            loadTableConfigList() // 重新加载数据
          } else {
            ElMessage.error(res.message || '删除失败')
          }
        } catch (error) {
          console.error('删除表格配置失败:', error)
          ElMessage.error('删除表格配置时发生错误')
        }
      })
      .catch(() => {
        // 用户取消操作
      })
  }

  // 处理恢复
  const handleRecover = (row: TableConfigModel) => {
    ElMessageBox.confirm(`确定要恢复表格配置 "${row.tableName}" 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    })
      .then(async () => {
        try {
          const res = await TableService.recoverTableConfig(row.id)
          if (res.success) {
            ElMessage.success('恢复成功')
            loadTableConfigList() // 重新加载数据
          } else {
            ElMessage.error(res.message || '恢复失败')
          }
        } catch (error) {
          console.error('恢复表格配置失败:', error)
          ElMessage.error('恢复表格配置时发生错误')
        }
      })
      .catch(() => {
        // 用户取消操作
      })
  }

  // 同步字段列表
  const handleSyncFields = async (row: TableConfigModel) => {
    try {
      // 构造正确的参数对象
      const params: SyncTableFieldListParams = {
        tableName: row.tableName,
        schemaName: row.schemaName
      }
      const res = await TableService.syncFieldsByTableName(params)
      if (res.success) {
        ElMessage.success('同步字段列表成功')
        loadTableConfigList() // 重新加载数据
      } else {
        ElMessage.error(res.message || '同步字段列表失败')
      }
    } catch (error) {
      console.error('同步字段列表失败:', error)
      ElMessage.error('同步字段列表时发生错误')
    }
  }

  // 处理添加
  const handleAdd = async () => {
    dialogType.value = 'add'
    resetForm()
    // 获取数据库名称列表
    await getSchemaNameList()
    dialogVisible.value = true
  }

  // 处理编辑
  const handleEdit = async (row: TableConfigModel) => {
    dialogType.value = 'edit'
    resetForm()
    // 获取数据库名称列表
    await getSchemaNameList()
    // 复制数据到表单
    Object.assign(formData, row)
    // 如果有数据库名称，获取对应的表名列表
    if (formData.schemaName) {
      await getTableNameList(formData.schemaName)
    }
    dialogVisible.value = true
  }

  // 重置表单
  const resetForm = () => {
    formData.id = undefined
    formData.tableName = ''
    formData.tablePrefix = ''
    formData.schemaName = ''
    formData.businessName = ''
    formData.moduleName = ''
    formData.packageName = ''
    formData.author = ''
    formData.generatePath = ''
    formData.options = ''
    formData.remarks = ''

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
            res = await TableService.addTableConfig(formData)
          } else {
            res = await TableService.editTableConfig({
              ...formData,
              id: formData.id!
            })
          }

          if (res.success) {
            ElMessage.success(dialogType.value === 'add' ? '添加成功' : '编辑成功')
            dialogVisible.value = false
            loadTableConfigList() // 重新加载数据
          } else {
            ElMessage.error(res.message || (dialogType.value === 'add' ? '添加失败' : '编辑失败'))
          }
        } catch (error) {
          console.error(
            dialogType.value === 'add' ? '添加表格配置失败:' : '编辑表格配置失败:',
            error
          )
          ElMessage.error(
            dialogType.value === 'add' ? '添加表格配置时发生错误' : '编辑表格配置时发生错误'
          )
        } finally {
          submitLoading.value = false
        }
      }
    })
  }

  // 列显示设置
  const changeColumn = (list: any) => {
    Object.assign(columns, list)
  }

  // 处理分页变化
  const handleCurrentChange = (page: number) => {
    queryParams.page = page
    loadTableConfigList()
  }

  // 处理每页显示数量变化
  const handleSizeChange = (size: number) => {
    queryParams.limit = size
    queryParams.page = 1 // 切换每页数量时重置为第一页
    loadTableConfigList()
  }

  // 获取数据库名称列表
  const getSchemaNameList = async () => {
    try {
      const res = await TableService.getSchemaNameList()
      if (res.success && res.data) {
        schemaNameList.value = res.data
      } else {
        ElMessage.error(res.message || '获取数据库名称列表失败')
      }
    } catch (error) {
      console.error('获取数据库名称列表失败:', error)
      ElMessage.error('获取数据库名称列表时发生错误')
    }
  }

  // 获取表名列表
  const getTableNameList = async (schemaName: string) => {
    try {
      const res = await TableService.getTableNameList({ schemaName: schemaName })
      if (res.success && res.data) {
        tableNameList.value = res.data
      } else {
        ElMessage.error(res.message || '获取表名列表失败')
      }
    } catch (error) {
      console.error('获取表名列表失败:', error)
      ElMessage.error('获取表名列表时发生错误')
    }
  }

  // 处理数据库名称变更
  const handleSchemaChange = async (val: string) => {
    // 清空表名
    formData.tableName = ''
    // 如果选择了数据库，获取表名列表
    if (val) {
      await getTableNameList(val)
    } else {
      tableNameList.value = []
    }
  }

  // 获取表格类型对应的文本
  const getTableTypeText = (typeCode: number): string => {
    return TableTypeTextMap[typeCode] || `未知类型(${typeCode})`
  }

  // 打开字段配置页面
  const openFieldConfig = async (tableConfig: TableConfigModel) => {
    // 设置当前选中的表格配置
    currentTableConfig.value = tableConfig

    // 显示加载中
    fieldListLoading.value = true

    try {
      // 根据表配置ID获取字段列表
      const res = await TableService.getFieldListByTableConfigId({ tableConfigId: tableConfig.id })
      if (res.success && res.data) {
        // 设置字段列表
        fieldList.value = res.data
        // 显示字段配置对话框
        showFieldConfig.value = true
      } else {
        ElMessage.error(res.message || '获取字段列表失败')
      }
    } catch (error) {
      console.error('获取字段列表失败:', error)
      ElMessage.error('获取字段列表时发生错误')
    } finally {
      fieldListLoading.value = false
    }
  }

  // 刷新表格数据
  const refreshTableData = async () => {
    await loadTableConfigList()
  }

  // 下载源码
  const handleDownloadCode = () => {
    if (selectedConfigs.value.length === 0) {
      ElMessage.warning('请至少选择一条记录')
      return
    }

    // 过滤掉已经标记为删除的记录
    const validConfigs = selectedConfigs.value.filter((config) => !config.delFlag)

    if (validConfigs.length === 0) {
      ElMessage.warning('所选记录均已被删除，请重新选择')
      return
    }

    ElMessageBox.confirm('确定要下载选中的表格配置源码吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    })
      .then(async () => {
        try {
          // 获取选中配置的ID列表
          const ids = validConfigs.map((config) => config.id)
          // 显示加载状态
          loading.value = true

          const res = await TableService.downloadCode({ ids })

          // 使用FileSaver进行下载，直接处理blob数据
          FileSaver.saveAs(res as Blob, '源码.zip')

          ElMessage.success('源码下载成功')
        } catch (error) {
          console.error('下载源码失败:', error)
          ElMessage.error('下载源码时发生错误')
        } finally {
          loading.value = false
        }
      })
      .catch(() => {
        // 用户取消操作
      })
  }

  // 组件挂载时加载数据
  onMounted(() => {
    loadTableConfigList()
  })
</script>

<style lang="scss" scoped>
  .page-content {
    width: 100%;
    height: 100%;
  }

  .search-buttons {
    display: flex;
    align-items: center;
    height: 32px;
    margin-top: 4px;

    .el-button {
      margin-right: 10px;

      &:last-child {
        margin-right: 0;
      }
    }
  }

  .compact-form {
    .el-form-item {
      margin-right: 0;
      margin-bottom: 18px;
    }
  }
</style>
