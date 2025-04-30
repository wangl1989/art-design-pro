<template>
  <div class="field-config-container">
    <el-dialog
      :model-value="visible"
      :title="`字段列表【所属表：${tableConfig?.tableName || ''}】`"
      width="1500"
      :append-to-body="true"
      :destroy-on-close="false"
      align-center
      @closed="handleClose"
      @update:model-value="(val) => emit('update:visible', val)"
    >
      <div class="table-actions">
        <el-button type="primary" @click="handleSyncFields" v-ripple>同步字段</el-button>
        <el-button :type="sortMode ? 'danger' : 'info'" @click="handleFieldSort" v-ripple>{{
          sortMode ? '退出排序' : '字段排序'
        }}</el-button>
        <template v-if="sortMode">
          <el-button type="success" @click="handleSaveSortOrder" v-ripple>保存排序</el-button>
          <el-button @click="handleCancelSort" v-ripple>取消排序</el-button>
        </template>
        <el-button type="success" @click="handlePreviewTable" v-ripple>预览表单</el-button>
      </div>

      <el-divider />

      <VueDraggable
        v-model="internalFieldList"
        target="tbody"
        handle=".handle"
        :animation="150"
        :disabled="!sortMode"
        item-key="id"
      >
        <el-table :data="internalFieldList" border stripe class="field-table" :loading="!!loading">
          <el-table-column label="ID" prop="id" min-width="60" />
          <el-table-column label="排序值" prop="sort" min-width="80" />
          <el-table-column label="字段名称" prop="columnName" min-width="120" />
          <el-table-column label="字段类型" prop="columnType" min-width="100" />
          <el-table-column label="业务名称" prop="businessName" min-width="150" />
          <el-table-column label="组件类型" prop="formComponentType" min-width="120">
            <template #default="scope">
              {{ componentTypeMap[scope.row.formComponentType] || scope.row.formComponentType }}
            </template>
          </el-table-column>
          <el-table-column label="是否唯一" min-width="100">
            <template #default="scope">
              <el-tag v-if="scope.row.isUnique" type="danger">是</el-tag>
              <el-tag v-else type="info">否</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="是否必填" min-width="100">
            <template #default="scope">
              <el-tag v-if="!scope.row.isNullable" type="danger">是</el-tag>
              <el-tag v-else type="info">否</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="是否查询字段" min-width="120">
            <template #default="scope">
              <el-tag v-if="scope.row.isQueryField" type="success">是</el-tag>
              <el-tag v-else type="info">否</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="是否列表显示" min-width="120">
            <template #default="scope">
              <el-tag v-if="scope.row.isListVisible" type="success">是</el-tag>
              <el-tag v-else type="info">否</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="是否新增字段" min-width="120">
            <template #default="scope">
              <el-tag v-if="scope.row.isAddVisible" type="success">是</el-tag>
              <el-tag v-else type="info">否</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="是否编辑字段" min-width="120">
            <template #default="scope">
              <el-tag v-if="scope.row.isEditVisible" type="success">是</el-tag>
              <el-tag v-else type="info">否</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="是否详情显示" min-width="120">
            <template #default="scope">
              <el-tag v-if="scope.row.isDetailVisible" type="success">是</el-tag>
              <el-tag v-else type="info">否</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="是否查询条件" min-width="120">
            <template #default="scope">
              <el-tag v-if="scope.row.isQueryField" type="success">是</el-tag>
              <el-tag v-else type="info">否</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="查询方式" prop="queryType" min-width="100">
            <template #default="scope">
              {{ queryTypeMap[scope.row.queryType] || scope.row.queryType }}
            </template>
          </el-table-column>
          <el-table-column label="关联类型" prop="associatedType" min-width="100">
            <template #default="scope">
              {{ associatedTypeMap[scope.row.associatedType] || scope.row.associatedType }}
            </template>
          </el-table-column>
          <el-table-column label="字典类型" prop="associatedDictType" min-width="100" />
          <el-table-column label="关联表名称" prop="associatedTable" min-width="100" />
          <el-table-column label="关联表字段" prop="associatedTableField" min-width="100" />
          <el-table-column label="校验规则" prop="validationRules" min-width="100" />
          <el-table-column label="字段注释" prop="columnComment" min-width="150" />
          <el-table-column label="操作" fixed="right" width="180">
            <template #default="scope">
              <el-button v-if="sortMode" class="handle" type="warning" link>
                <el-icon>
                  <el-icon-rank />
                </el-icon>
                移动
              </el-button>
              <el-button v-else type="primary" link @click="handleEditField(scope.row)">
                编辑
              </el-button>
              <el-button v-if="!sortMode" type="danger" link @click="handleDeleteField(scope.row)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </VueDraggable>

      <!-- 这里预留位置，后续可以添加分页组件 -->
    </el-dialog>

    <!-- 添加编辑字段对话框 -->
    <el-dialog
      v-model="fieldDialogVisible"
      :title="fieldDialogTitle"
      width="850px"
      :append-to-body="true"
      :destroy-on-close="true"
      @closed="resetFieldForm"
    >
      <el-form ref="fieldFormRef" :model="fieldForm" label-width="100px" :rules="fieldFormRules">
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="字段名称" prop="columnName">
              <el-input v-model="fieldInfo.columnName" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="字段类型" prop="columnType">
              <el-input v-model="fieldInfo.columnType" disabled />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="字段注释" prop="columnComment">
              <el-input v-model="fieldInfo.columnComment" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="业务名称" prop="businessName">
              <el-input v-model="fieldForm.businessName" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="组件类型" prop="formComponentType">
              <el-select
                v-model="fieldForm.formComponentType"
                placeholder="请选择组件类型"
                style="width: 100%"
                clearable
              >
                <el-option label="输入框" value="INPUT" />
                <el-option label="文本域" value="TEXTAREA" />
                <el-option label="下拉框" value="SELECT" />
                <el-option label="数字框" value="INPUT_NUMBER" />
                <el-option label="单选框" value="RADIO" />
                <el-option label="复选框" value="CHECKBOX" />
                <el-option label="颜色选择器" value="COLOR_PICKER" />
                <el-option label="图标选择器" value="ICON_PICKER" />
                <el-option label="日期选择器" value="DATE_PICKER" />
                <el-option label="时间选择器" value="TIME_PICKER" />
                <el-option label="日期时间选择器" value="DATETIME_PICKER" />
                <el-option label="开关" value="SWITCH" />
                <el-option label="图片上传" value="IMAGE_UPLOAD" />
                <el-option label="文件上传" value="FILE_UPLOAD" />
                <el-option label="富文本编辑器" value="RICH_TEXT" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="校验规则" prop="validationRules">
              <el-input
                v-model="fieldForm.validationRules"
                placeholder="如：required|email|max:50"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item
              label="关联类型"
              prop="associatedType"
              :rules="[
                {
                  required: isAssociatedTypeRequired,
                  message: '请选择关联类型',
                  trigger: 'change'
                }
              ]"
            >
              <el-select
                v-model="fieldForm.associatedType"
                placeholder="请选择关联类型"
                style="width: 100%"
                @change="handleAssociatedTypeChange"
                :required="isAssociatedTypeRequired"
                clearable
              >
                <el-option label="字典类型" :value="1" />
                <el-option label="关联表名" :value="2" />
              </el-select>
              <div
                class="el-form-item-msg"
                v-if="isAssociatedTypeRequired && !fieldForm.associatedType"
              >
                <span class="warning-text">当前组件类型必须关联数据源</span>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="fieldForm.associatedType === 1">
            <el-form-item label="字典类型" prop="associatedDictType">
              <el-select
                v-model="fieldForm.associatedDictType"
                placeholder="请选择字典类型"
                style="width: 100%"
                filterable
                clearable
                @change="handleDictTypeChange"
              >
                <el-option
                  v-for="item in dictTypeList"
                  :key="item.type"
                  :label="item.type"
                  :value="item.type"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="fieldForm.associatedType === 2">
            <el-form-item label="关联表名" prop="associatedTable">
              <el-select
                v-model="fieldForm.associatedTable"
                placeholder="请选择关联表名"
                style="width: 100%"
                filterable
                clearable
                @change="handleTableNameChange"
              >
                <el-option
                  v-for="item in associatedTableList"
                  :key="item"
                  :label="item"
                  :value="item"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="12" v-if="fieldForm.associatedType === 2 && fieldForm.associatedTable">
          <el-col :span="12">
            <el-form-item label="显示字段" prop="associatedTableField">
              <el-select
                v-model="fieldForm.associatedTableField"
                placeholder="请选择显示字段"
                style="width: 100%"
                filterable
                clearable
              >
                <el-option
                  v-for="item in associatedTableFields"
                  :key="item.columnName || ''"
                  :label="`${item.columnName || ''}(${item.columnComment || '无注释'})`"
                  :value="item.columnName || ''"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="12">
          <el-col :span="6">
            <el-tooltip content="字段是否要求唯一值" placement="top">
              <el-form-item label="是否唯一" label-width="80px">
                <el-switch v-model="fieldForm.isUnique"></el-switch>
              </el-form-item>
            </el-tooltip>
          </el-col>
          <el-col :span="6">
            <el-tooltip
              :content="
                originalFieldData && originalFieldData.isNullable === false
                  ? '数据库必填字段不可修改'
                  : '字段是否为必填项'
              "
              placement="top"
            >
              <el-form-item label="是否必填" label-width="80px">
                <el-switch
                  v-model="fieldForm.isNullable"
                  :active-value="false"
                  :inactive-value="true"
                  :disabled="
                    originalFieldData && originalFieldData.isNullable === false ? true : false
                  "
                ></el-switch>
              </el-form-item>
            </el-tooltip>
          </el-col>
          <el-col :span="6">
            <el-tooltip content="是否在列表页显示该字段" placement="top">
              <el-form-item label="列表显示" label-width="80px">
                <el-switch v-model="fieldForm.isListVisible"></el-switch>
              </el-form-item>
            </el-tooltip>
          </el-col>
          <el-col :span="6">
            <el-tooltip content="是否在新增表单中显示该字段" placement="top">
              <el-form-item label="新增字段" label-width="80px">
                <el-switch v-model="fieldForm.isAddVisible"></el-switch>
              </el-form-item>
            </el-tooltip>
          </el-col>
        </el-row>

        <el-row :gutter="12">
          <el-col :span="6">
            <el-tooltip content="是否在编辑表单中显示该字段" placement="top">
              <el-form-item label="编辑字段" label-width="80px">
                <el-switch v-model="fieldForm.isEditVisible"></el-switch>
              </el-form-item>
            </el-tooltip>
          </el-col>
          <el-col :span="6">
            <el-tooltip content="是否在详情页中显示该字段" placement="top">
              <el-form-item label="详情显示" label-width="80px">
                <el-switch v-model="fieldForm.isDetailVisible"></el-switch>
              </el-form-item>
            </el-tooltip>
          </el-col>
          <el-col :span="6">
            <el-tooltip content="是否作为查询条件" placement="top">
              <el-form-item label="查询条件" label-width="80px">
                <el-switch v-model="fieldForm.isQueryField"></el-switch>
              </el-form-item>
            </el-tooltip>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="排序值" prop="sort">
              <el-input-number
                v-model="fieldForm.sort"
                :min="0"
                :max="9999"
                controls-position="right"
                :precision="0"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="查询方式" prop="queryType" v-if="fieldForm.isQueryField">
          <el-select v-model="fieldForm.queryType" placeholder="请选择查询方式" style="width: 100%">
            <el-option label="等于(=)" value="eq" />
            <el-option label="不等于(!=)" value="ne" />
            <el-option label="大于(>)" value="gt" />
            <el-option label="大于等于(>=)" value="ge" />
            <el-option label="小于(<)" value="lt" />
            <el-option label="小于等于(<=)" value="le" />
            <el-option label="模糊查询(like)" value="like" />
            <el-option label="左模糊(%like)" value="left_like" />
            <el-option label="右模糊(like%)" value="right_like" />
            <el-option label="范围查询(between)" value="between" />
            <el-option label="包含(in)" value="in" />
            <el-option label="不包含(not in)" value="not_in" />
            <el-option label="不为空(is not null)" value="is_not_null" />
            <el-option label="为空(is null)" value="is_null" />
          </el-select>
        </el-form-item>

        <el-form-item label="备注" prop="remarks">
          <el-input
            v-model="fieldForm.remarks"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="fieldDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitFieldForm" :loading="submitLoading">确定</el-button>
      </template>
    </el-dialog>

    <!-- 添加预览对话框 -->
    <el-dialog
      v-model="previewVisible"
      :title="`预览表单【${tableConfig?.tableName || ''}】`"
      width="90%"
      :append-to-body="true"
      :destroy-on-close="true"
      fullscreen
    >
      <!-- 使用预览组件 -->
      <TablePreview :tableConfig="tableConfig" :fieldList="internalFieldList" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref, reactive, watch, onMounted } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { VueDraggable } from 'vue-draggable-plus'
  import {
    TableConfigModel,
    TableFieldConfigModel,
    SyncTableFieldListParams,
    getSimpleTableFieldParam,
    SimpleTableField
  } from '@/api/model/tableConfigModel'
  import { TableService } from '@/api/tableConfigApi'
  import { DictService } from '@/api/dictApi'
  import type { FormInstance, FormRules } from 'element-plus'
  // 导入预览组件
  import TablePreview from './TablePreview.vue'

  const props = defineProps<{
    visible: boolean
    tableConfig?: TableConfigModel
    fieldList?: TableFieldConfigModel[]
    loading?: boolean
  }>()

  const emit = defineEmits(['update:visible', 'refresh'])

  // 使用内部可变的响应式变量而不是computed
  const internalFieldList = ref<TableFieldConfigModel[]>([])
  // 加载状态
  const fieldListLoading = ref(false)

  // 在props.fieldList变化时更新内部列表
  watch(
    () => props.fieldList,
    (newVal) => {
      if (newVal) {
        internalFieldList.value = [...newVal]
      }
    },
    { immediate: true, deep: true }
  )

  // 添加加载字段数据的方法
  const loadFieldData = async () => {
    if (!props.tableConfig?.id) {
      ElMessage.warning('缺少表配置ID，无法加载字段列表')
      return
    }

    fieldListLoading.value = true
    try {
      const res = await TableService.getFieldListByTableConfigId({
        tableConfigId: props.tableConfig.id
      })
      if (res.success && res.data) {
        internalFieldList.value = res.data
      } else {
        ElMessage.error(res.message || '加载字段列表失败')
      }
    } catch (error) {
      console.error('加载字段列表失败:', error)
      ElMessage.error('加载字段列表时发生错误')
    } finally {
      fieldListLoading.value = false
    }
  }

  // 添加排序模式状态变量
  const sortMode = ref(false)

  // 用于存储排序前的字段列表，以便取消排序时恢复
  const originalFieldListBackup = ref<TableFieldConfigModel[]>([])

  // 处理关闭对话框
  const handleClose = () => {
    emit('update:visible', false)
  }

  // 提交加载状态
  const submitLoading = ref(false)

  // 字段表单对话框
  const fieldDialogVisible = ref(false)
  const fieldDialogTitle = ref('编辑字段')
  const fieldFormRef = ref<FormInstance>()

  // 保存原始字段数据，用于【是否必填】字段的校验
  const originalFieldData = ref<TableFieldConfigModel | null>(null)

  // 字典类型列表
  const dictTypeList = ref<any[]>([])
  // 关联表列表
  const associatedTableList = ref<string[]>([])
  // 关联表字段列表
  const associatedTableFields = ref<SimpleTableField[]>([])

  // 字段信息（只读或从行数据中获取的字段）
  const fieldInfo = reactive({
    columnName: '',
    columnType: '',
    columnComment: '',
    javaType: '',
    javaFieldName: '',
    tableConfigId: 0,
    schemaName: '',
    tableName: ''
  })

  // 字段表单数据（实际提交的字段）
  const fieldForm = reactive<any>({
    id: 0,
    businessName: '',
    formComponentType: '',
    dictType: '',
    validationRules: '',
    isUnique: false,
    isNullable: true,
    isQueryField: false,
    isListVisible: true,
    isAddVisible: true,
    isEditVisible: true,
    isDetailVisible: true,
    queryType: 'eq',
    sort: 0,
    remarks: '',
    // 新增字段
    associatedType: null, // 1: 字典类型, 2: 关联表名
    associatedDictType: '',
    associatedTable: '',
    associatedTableField: ''
  })

  // 判断关联类型是否必填
  const isAssociatedTypeRequired = computed(() => {
    return ['SELECT', 'RADIO', 'CHECKBOX'].includes(fieldForm.formComponentType)
  })

  // 字段表单验证规则
  const fieldFormRules = reactive<FormRules>({
    formComponentType: [{ required: false, message: '请选择组件类型', trigger: 'change' }],
    associatedType: [{ required: false, message: '请选择关联类型', trigger: 'change' }],
    associatedDictType: [
      {
        required: false, // 初始设为false，在运行时动态检查
        message: '请选择字典类型',
        trigger: 'change'
      }
    ],
    associatedTable: [
      {
        required: false, // 初始设为false，在运行时动态检查
        message: '请选择关联表名',
        trigger: 'change'
      }
    ],
    associatedTableField: [{ required: false, message: '请选择显示字段', trigger: 'change' }]
  })

  // 获取字典类型列表
  const loadDictTypeList = async () => {
    try {
      const res = await DictService.getDictTypeList()
      if (res.success && res.data) {
        dictTypeList.value = res.data as any
      }
    } catch (error) {
      console.error('获取字典类型列表失败:', error)
    }
  }

  // 获取关联表列表
  const loadAssociatedTableList = async (schemaName: string) => {
    if (!schemaName) {
      ElMessage.warning('缺少数据库名称，无法获取关联表列表')
      return
    }

    try {
      const res = await TableService.getTableNameList({ schemaName })
      if (res.success && res.data) {
        associatedTableList.value = res.data
      }
    } catch (error) {
      console.error('获取关联表列表失败:', error)
    }
  }

  // 获取关联表字段列表
  const loadAssociatedTableFields = async () => {
    try {
      const fieldParams: getSimpleTableFieldParam = {
        tableName: fieldForm.associatedTable || '',
        schemaName: props.tableConfig?.schemaName || ''
      }
      const res = await TableService.getSimpleTableField(fieldParams)
      if (res.success && res.data) {
        associatedTableFields.value = Array.isArray(res.data) ? res.data : [res.data]
      }
    } catch (error) {
      console.error('获取表字段列表失败:', error)
    }
  }

  // 关联类型变化处理
  const handleAssociatedTypeChange = (val: number) => {
    // 重置相关字段
    if (val === 1) {
      fieldForm.associatedTable = ''
      fieldForm.associatedTableField = ''

      // 加载字典类型列表
      if (dictTypeList.value.length === 0) {
        loadDictTypeList()
      }
    } else if (val === 2) {
      fieldForm.associatedDictType = ''

      // 加载关联表列表
      if (fieldInfo.schemaName && associatedTableList.value.length === 0) {
        loadAssociatedTableList(fieldInfo.schemaName)
      }
    }
  }

  // 字典类型变化处理
  const handleDictTypeChange = (val: string) => {
    if (val) {
      // 可以在这里做一些字典类型相关的逻辑
    }
  }

  // 关联表名变化处理
  const handleTableNameChange = async (val: string) => {
    // 清空关联表字段
    fieldForm.associatedTableField = ''

    if (val && fieldInfo.tableConfigId) {
      // 加载关联表字段列表
      await loadAssociatedTableFields()
    }
  }

  // 重置字段表单和信息
  const resetFieldForm = () => {
    // 重置原始数据
    originalFieldData.value = null

    // 重置字段信息
    fieldInfo.columnName = ''
    fieldInfo.columnType = ''
    fieldInfo.columnComment = ''
    fieldInfo.javaType = ''
    fieldInfo.javaFieldName = ''
    fieldInfo.tableConfigId = 0
    fieldInfo.schemaName = ''

    // 重置字段表单
    fieldForm.id = 0
    fieldForm.businessName = ''
    fieldForm.formComponentType = ''
    fieldForm.dictType = ''
    fieldForm.validationRules = ''
    fieldForm.isUnique = false
    fieldForm.isNullable = true
    fieldForm.isQueryField = false
    fieldForm.isListVisible = true
    fieldForm.isAddVisible = true
    fieldForm.isEditVisible = true
    fieldForm.isDetailVisible = true
    fieldForm.queryType = 'eq'
    fieldForm.sort = 0
    fieldForm.remarks = ''
    // 重置新增字段
    fieldForm.associatedType = null
    fieldForm.associatedDictType = ''
    fieldForm.associatedTable = ''
    fieldForm.associatedTableField = ''

    // 重置列表数据
    dictTypeList.value = []
    associatedTableList.value = []
    associatedTableFields.value = []
  }

  // 同步字段
  const handleSyncFields = async () => {
    if (!props.tableConfig?.id) {
      ElMessage.warning('缺少表配置ID')
      return
    }

    try {
      // 构造正确的参数
      const params: SyncTableFieldListParams = {
        tableName: props.tableConfig.tableName,
        schemaName: props.tableConfig.schemaName
      }
      const res = await TableService.syncFieldsByTableName(params)
      if (res.success) {
        ElMessage.success('同步字段成功')
        // 刷新本组件字段列表
        await loadFieldData()
        // 刷新父组件数据
        emit('refresh')
      } else {
        ElMessage.error(res.message || '同步字段失败')
      }
    } catch (error) {
      console.error('同步字段失败:', error)
      ElMessage.error('同步字段时发生错误')
    }
  }

  // 修改字段排序方法
  const handleFieldSort = () => {
    // 切换排序模式
    sortMode.value = !sortMode.value

    if (sortMode.value) {
      // 进入排序模式，备份当前字段列表
      originalFieldListBackup.value = JSON.parse(JSON.stringify(internalFieldList.value))
      ElMessage.info('已进入排序模式，请通过拖拽"移动"按钮对字段进行排序，完成后点击"保存排序"按钮')
    } else {
      // 如果是退出排序模式，恢复原始数据（取消排序）
      // 这里不需要调用API，所以直接恢复备份的数据
      internalFieldList.value = [...originalFieldListBackup.value]
      loadFieldData() // 刷新字段列表数据
      emit('refresh')
    }
  }

  // 保存排序方法
  const handleSaveSortOrder = async () => {
    if (!props.tableConfig?.id) {
      ElMessage.warning('缺少表配置ID')
      return
    }

    try {
      // 获取排序后的字段ID列表
      const sortedIds = internalFieldList.value.map((field: TableFieldConfigModel) => field.id)

      // 调用排序API
      const res = await TableService.fieldSort({ ids: sortedIds })
      if (res.success) {
        ElMessage.success('字段排序保存成功')
        sortMode.value = false
        // 刷新本组件字段列表
        await loadFieldData()
        // 刷新父组件数据
        emit('refresh')
      } else {
        ElMessage.error(res.message || '保存排序失败')
      }
    } catch (error) {
      console.error('保存字段排序失败:', error)
      ElMessage.error('保存字段排序时发生错误')
    }
  }

  // 添加取消排序方法
  const handleCancelSort = () => {
    // 恢复原始字段列表
    if (sortMode.value) {
      internalFieldList.value = [...originalFieldListBackup.value]
      ElMessage.info('已取消排序')
      sortMode.value = false
      // 刷新字段列表数据
      loadFieldData()
      // 恢复备份的数据
      emit('refresh')
    }
  }

  // 编辑字段
  const handleEditField = (field: TableFieldConfigModel) => {
    fieldDialogTitle.value = `编辑字段【${field.columnName}】`

    // 保存原始字段数据，用于【是否必填】字段的校验
    originalFieldData.value = { ...field }

    // 设置字段信息（从行数据中获取）
    fieldInfo.columnName = field.columnName
    fieldInfo.columnType = field.columnType
    fieldInfo.columnComment = field.columnComment || ''
    fieldInfo.javaType = field.javaType
    fieldInfo.javaFieldName = field.javaFieldName
    fieldInfo.tableConfigId = field.tableConfigId
    fieldInfo.schemaName = field.schemaName

    // 设置字段表单数据（实际需要编辑的内容）
    fieldForm.id = field.id
    fieldForm.businessName = field.businessName || ''
    fieldForm.formComponentType = field.formComponentType || ''
    fieldForm.dictType = field.dictType || ''
    fieldForm.validationRules = field.validationRules || ''
    fieldForm.isUnique = field.isUnique || false
    fieldForm.isNullable = field.isNullable ?? true
    fieldForm.isQueryField = field.isQueryField || false
    fieldForm.isListVisible = field.isListVisible ?? true
    fieldForm.isAddVisible = field.isAddVisible ?? true
    fieldForm.isEditVisible = field.isEditVisible ?? true
    fieldForm.isDetailVisible = field.isDetailVisible ?? true
    if (field.isQueryField) {
      fieldForm.queryType = field.queryType || ''
    } else {
      fieldForm.queryType = ''
    }
    fieldForm.sort = field.sort || 0
    fieldForm.remarks = field.remarks || ''

    // 设置新增字段的值
    fieldForm.associatedType = field.associatedType || null
    fieldForm.associatedDictType = field.associatedDictType || ''
    fieldForm.associatedTable = field.associatedTable || ''
    fieldForm.associatedTableField = field.associatedTableField || ''

    // 根据关联类型加载对应的数据
    if (fieldForm.associatedType === 1) {
      loadDictTypeList()
    } else if (fieldForm.associatedType === 2 && fieldInfo.schemaName) {
      loadAssociatedTableList(fieldInfo.schemaName)
      if (fieldForm.associatedTable && fieldInfo.tableConfigId) {
        loadAssociatedTableFields()
      }
    }

    fieldDialogVisible.value = true
  }

  // 提交字段表单
  const submitFieldForm = async () => {
    if (!fieldFormRef.value) return

    // 在表单验证前进行额外验证
    if (isAssociatedTypeRequired.value && !fieldForm.associatedType) {
      ElMessage.error('当前组件类型必须设置关联类型')
      return
    }

    // 增加对关联子项的验证
    if (
      isAssociatedTypeRequired.value &&
      fieldForm.associatedType === 1 &&
      !fieldForm.associatedDictType
    ) {
      ElMessage.error('请选择字典类型')
      return
    }

    if (
      isAssociatedTypeRequired.value &&
      fieldForm.associatedType === 2 &&
      !fieldForm.associatedTable
    ) {
      ElMessage.error('请选择关联表名')
      return
    }

    await fieldFormRef.value.validate(async (valid) => {
      if (valid) {
        submitLoading.value = true
        try {
          // 构造编辑字段参数，确保符合EditTableFieldConfigParams类型
          const params: any = {
            ...fieldForm,
            tableId: props.tableConfig?.id || 0,
            // 使用fieldInfo中的只读数据
            columnName: fieldInfo.columnName,
            columnType: fieldInfo.columnType,
            columnComment: fieldInfo.columnComment,
            javaType: fieldInfo.javaType,
            javaFieldName: fieldInfo.javaFieldName,
            tableConfigId: fieldInfo.tableConfigId
          }
          console.log('params', params)
          const res = await TableService.editTableFieldConfig(params)
          if (res.success) {
            ElMessage.success('保存成功')
            fieldDialogVisible.value = false

            // 刷新本组件字段列表
            await loadFieldData()
            // 刷新父组件数据
            emit('refresh')
          } else {
            ElMessage.error(res.message || '保存失败')
          }
        } catch (error) {
          console.error('保存字段配置失败:', error)
          ElMessage.error('保存字段配置时发生错误')
        } finally {
          submitLoading.value = false
        }
      }
    })
  }

  // 监听父组件传递的tableConfig变化
  watch(
    () => props.tableConfig,
    (newVal) => {
      // 当tableConfig变化且有有效ID时，加载字段列表
      if (newVal && newVal.id) {
        loadFieldData()
      }
      console.log('tableConfig已更新，字段列表已刷新')
    },
    { deep: true }
  )

  // 组件挂载时初始化
  onMounted(() => {
    // 预加载字典类型列表
    loadDictTypeList()

    // 如果有tableConfig，则加载字段列表
    if (props.tableConfig?.id) {
      loadFieldData()
    }
  })

  // 预览整个表单
  const handlePreviewTable = () => {
    if (!props.tableConfig) {
      ElMessage.warning('缺少表配置信息')
      return
    }

    // 显示预览对话框
    previewVisible.value = true
  }

  // 添加预览对话框可见性控制变量
  const previewVisible = ref(false)

  // 删除字段
  const handleDeleteField = (field: TableFieldConfigModel) => {
    ElMessageBox.confirm(`确定要删除字段 "${field.columnName}" 吗？`, '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(() => {
        ElMessage.info('字段删除功能待实现')
        // 这里可以添加删除字段的API调用
        console.log('删除字段:', field)
        // 删除成功后刷新本组件字段列表
        loadFieldData()
        // 刷新父组件数据
        emit('refresh')
      })
      .catch(() => {
        // 用户取消操作
      })
  }

  // 添加对formComponentType的监听
  // 在script部分增加watch
  // 监听组件类型变化，当选择特定组件时关联类型为必填
  watch(
    () => fieldForm.formComponentType,
    (newVal) => {
      if (['SELECT', 'RADIO', 'CHECKBOX'].includes(newVal)) {
        // 如果切换到需要关联类型的组件，但当前未设置关联类型，给出提示
        if (!fieldForm.associatedType) {
          ElMessage.warning('当前组件类型需要设置关联类型')
        }
      }
    }
  )

  // 组件类型映射
  const componentTypeMap: Record<string, string> = {
    INPUT: '输入框',
    TEXTAREA: '文本域',
    SELECT: '下拉框',
    INPUT_NUMBER: '数字框',
    RADIO: '单选框',
    CHECKBOX: '复选框',
    COLOR_PICKER: '颜色选择器',
    ICON_PICKER: '图标选择器',
    DATE_PICKER: '日期选择器',
    TIME_PICKER: '时间选择器',
    DATETIME_PICKER: '日期时间选择器',
    SWITCH: '开关',
    IMAGE_UPLOAD: '图片上传',
    FILE_UPLOAD: '文件上传',
    RICH_TEXT: '富文本编辑器'
  }

  // 查询方式映射
  const queryTypeMap: Record<string, string> = {
    eq: '等于(=)',
    ne: '不等于(!=)',
    gt: '大于(>)',
    ge: '大于等于(>=)',
    lt: '小于(<)',
    le: '小于等于(<=)',
    like: '模糊查询(like)',
    left_like: '左模糊(%like)',
    right_like: '右模糊(like%)',
    between: '范围查询(between)',
    in: '包含(in)',
    not_in: '不包含(not in)',
    is_not_null: '不为空(is not null)',
    is_null: '为空(is null)'
  }

  // 关联类型映射
  const associatedTypeMap: Record<number, string> = {
    1: '字典类型',
    2: '关联表名'
  }
</script>

<style lang="scss" scoped>
  .field-config-container {
    .table-actions {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
    }

    .field-table {
      margin-top: 10px;
    }

    :deep(.el-divider) {
      margin: 16px 0;
    }
  }

  :deep(.el-form-item__label) {
    font-weight: normal;
  }

  :deep(.el-dialog__body) {
    padding: 15px 20px;
  }

  :deep(.el-form-item) {
    margin-bottom: 15px;
  }

  :deep(.el-switch) {
    margin-left: 0;
  }

  :deep(.el-form--label-right .el-form-item__label) {
    padding-right: 8px;
  }

  .warning-text {
    display: inline-block;
    padding-top: 4px;
    font-size: 12px;
    line-height: 1;
    color: #e6a23c;
  }

  .el-form-item-msg {
    margin-top: 4px;
  }
</style>
