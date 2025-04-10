<template>
  <div class="page-content">
    <el-row :gutter="20" style="margin-left: 15px">
      <el-button type="primary" @click="showModel('menu', null, true)" v-ripple>
        新增主菜单
      </el-button>
      <el-button v-auth="'add'" @click="showModel('menu', null, true)" v-ripple>添加菜单</el-button>
    </el-row>

    <art-table :data="tableData">
      <template #default>
        <el-table-column label="菜单名称">
          <template #default="scope">
            {{ formatMenuTitle(scope.row.meta?.title) }}
          </template>
        </el-table-column>
        <el-table-column prop="path" label="路由" />

        <el-table-column prop="meta.authList" label="可操作权限">
          <template #default="scope">
            <!-- 检查是否有权限列表 -->
            <div v-if="scope.row.meta?.authList && scope.row.meta.authList.length > 0">
              <!-- 权限按钮 -->
              <el-button type="primary" link @click="toggleAuthList(scope.$index)">
                共 {{ scope.row.meta.authList.length }} 个权限
              </el-button>

              <!-- 自定义的权限列表弹出框，通过状态控制 -->
              <el-dialog
                v-model="authListVisible[scope.$index]"
                title="权限列表"
                :width="500"
                :append-to-body="true"
                :destroy-on-close="false"
                align-center
              >
                <permission-list
                  :permissions="scope.row.meta.authList"
                  @edit="(item) => showModel('button', item)"
                  @delete="deleteAuth"
                />
              </el-dialog>
            </div>
            <!-- 如果没有权限则显示 '-' -->
            <span v-else>-</span>
          </template>
        </el-table-column>

        <el-table-column label="编辑时间" prop="updateDate">
          <template #default="scope">{{ formatDate(scope.row.updateDate) }}</template>
        </el-table-column>

        <el-table-column fixed="right" label="操作" width="180">
          <template #default="scope">
            <button-table type="add" @click="showModel('menu')" />
            <button-table type="edit" @click="showDialog('edit', scope.row)" />
            <button-table type="delete" @click="deleteMenu" />
          </template>
        </el-table-column>
      </template>
    </art-table>

    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="700px" align-center>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="85px">
        <el-form-item label="菜单类型">
          <el-radio-group v-model="labelPosition" :disabled="disableMenuType">
            <el-radio-button value="menu" label="menu">菜单</el-radio-button>
            <el-radio-button value="button" label="button">权限</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <template v-if="labelPosition === 'menu'">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="菜单标题" prop="title">
                <el-input v-model="form.title" placeholder="菜单标题"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="路由地址" prop="path">
                <el-input v-model="form.path" placeholder="路由地址"></el-input>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="菜单名称" prop="name">
                <el-input v-model="form.name" placeholder="菜单名称"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="图标" prop="icon">
                <icon-selector
                  v-model="form.icon"
                  :iconType="iconType"
                  :defaultIcon="form.icon"
                  :iconColor="form.color"
                  width="230px"
                />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="组件路径" prop="component">
                <el-input v-model="form.component" placeholder="例如: system/user/index"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="颜色" prop="color">
                <el-color-picker
                  v-model="form.color"
                  :predefine="predefineColors"
                  class="full-width-color-picker"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="外部链接" prop="link">
                <el-input
                  v-model="form.link"
                  placeholder="外部链接/内嵌地址(https://www.baidu.com)"
                ></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="文本徽章" prop="showTextBadge">
                <el-input v-model="form.showTextBadge" placeholder="留空则不显示"></el-input>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="菜单排序" prop="sort" style="width: 100%">
                <el-input-number
                  v-model="form.sort"
                  style="width: 100%"
                  @change="handleChange"
                  :min="1"
                  controls-position="right"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="5">
              <el-tooltip content="菜单是否在侧边栏隐藏" placement="top">
                <el-form-item label="隐藏菜单" prop="isHidden">
                  <el-switch v-model="form.isHidden"></el-switch>
                </el-form-item>
              </el-tooltip>
            </el-col>
            <el-col :span="5">
              <el-tooltip content="页面是否使用 keep-alive 缓存" placement="top">
                <el-form-item label="页面缓存" prop="keepAlive">
                  <el-switch v-model="form.keepAlive"></el-switch>
                </el-form-item>
              </el-tooltip>
            </el-col>
            <el-col :span="5">
              <el-tooltip content="是否为内嵌外部链接 (iframe)" placement="top">
                <el-form-item label="是否内嵌" prop="isIframe">
                  <el-switch v-model="form.isIframe"></el-switch>
                </el-form-item>
              </el-tooltip>
            </el-col>
            <el-col :span="5">
              <el-tooltip content="是否在标签页栏隐藏" placement="top">
                <el-form-item label="隐藏Tab" prop="isHideTab">
                  <el-switch v-model="form.isHideTab"></el-switch>
                </el-form-item>
              </el-tooltip>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="5">
              <el-tooltip content="是否在顶部和侧边栏显示徽标" placement="top">
                <el-form-item label="显示徽标" prop="showBadge">
                  <el-switch v-model="form.showBadge"></el-switch>
                </el-form-item>
              </el-tooltip>
            </el-col>
            <el-col :span="5">
              <el-tooltip content="当前路由是否在主布局内显示 (通常为 true)" placement="top">
                <el-form-item label="主布局内" prop="isInMainContainer">
                  <el-switch v-model="form.isInMainContainer"></el-switch>
                </el-form-item>
              </el-tooltip>
            </el-col>
            <!-- isEnable 和 isMenu 是旧的字段，模型中没有，暂时注释或移除 -->
            <!-- <el-col :span="5">
              <el-form-item label="是否启用" prop="isEnable">
                <el-switch v-model="form.isEnable"></el-switch>
              </el-form-item>
            </el-col>
            <el-col :span="5">
              <el-form-item label="是否内嵌" prop="isMenu">
                 <el-switch v-model="form.isIframe"></el-switch> isIframe 似乎更合适
                <el-switch v-model="form.isMenu"></el-switch> 
              </el-form-item>
            </el-col> -->
          </el-row>

          <el-form-item label="备注" prop="remarks">
            <el-input
              type="textarea"
              v-model="form.remarks"
              placeholder="请输入备注信息"
              :rows="5"
            ></el-input>
          </el-form-item>
        </template>

        <template v-if="labelPosition === 'button'">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="权限名称" prop="authName">
                <el-input v-model="form.authName" placeholder="权限名称"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="权限标识" prop="authLabel">
                <el-input v-model="form.authLabel" placeholder="权限标识"></el-input>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="权限排序" prop="authSort" style="width: 100%">
                <el-input-number
                  v-model="form.authSort"
                  style="width: 100%"
                  @change="handleChange"
                  :min="1"
                  controls-position="right"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </template>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="submitForm()"> 确 定 </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  import { useMenuStore } from '@/store/modules/menu'
  import type { FormInstance, FormRules } from 'element-plus'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { IconTypeEnum } from '@/enums/appEnum'
  import { formatMenuTitle } from '@/utils/menu'
  import { formatDate } from '@/utils/date'
  import { reactive, ref, computed, nextTick } from 'vue'
  import PermissionList from '@/components/Permission/PermissionList.vue'
  import { menuService, MenuApiService } from '@/api/menuApi'
  import type { AddMenuParams, EditMenuParams } from '@/api/model/menuModel'

  const menuList = computed(() => useMenuStore().getMenuList)

  // 用于跟踪每个菜单的权限列表是否显示
  const authListVisible = reactive<Record<number, boolean>>({})

  // 切换权限列表的显示/隐藏
  const toggleAuthList = (index: number) => {
    authListVisible[index] = !authListVisible[index]
  }

  const dialogVisible = ref(false)
  const form = reactive({
    // 菜单
    title: '',
    path: '',
    name: '',
    icon: '',
    color: '',
    isEnable: true,
    sort: 1,
    isMenu: true,
    keepAlive: true,
    isHidden: true,
    link: '',
    isIframe: false,
    remarks: '',
    component: '',
    showBadge: false,
    showTextBadge: '',
    isHideTab: false,
    isInMainContainer: true,
    // 权限 (修改这部分)
    authName: '',
    authLabel: '',
    authIcon: '',
    authSort: 1
  })

  // 预定义颜色
  const predefineColors = ref([
    '#409EFF', // 主题蓝
    '#67C23A', // 成功绿
    '#E6A23C', // 警告黄
    '#F56C6C', // 错误红
    '#909399', // 信息灰
    '#9370DB', // 紫罗兰
    '#FFC0CB', // 粉红
    '#90EE90', // 淡绿
    '#B0E0E6', // 粉蓝
    '#FF69B4', // 热粉
    '#778899', // 亮蓝灰
    '#00CED1', // 深天蓝
    '#FFDAB9' // 桃红
  ])

  const iconType = ref(IconTypeEnum.UNICODE)

  const labelPosition = ref('menu')
  const rules = reactive<FormRules>({
    title: [
      { required: true, message: '请输入菜单标题', trigger: 'blur' },
      { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
    ],
    path: [{ required: true, message: '请输入路由地址', trigger: 'blur' }],
    name: [
      { required: true, message: '请输入菜单名称', trigger: 'blur' },
      { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
    ],
    authName: [{ required: true, message: '请输入权限名称', trigger: 'blur' }],
    authLabel: [{ required: true, message: '请输入权限权限标识', trigger: 'blur' }]
  })

  const tableData = computed(() => menuList.value)

  const isEdit = ref(false)
  const formRef = ref<FormInstance>()
  const dialogTitle = computed(() => {
    const type = labelPosition.value === 'menu' ? '菜单' : '权限'
    return isEdit.value ? `编辑${type}` : `新建${type}`
  })

  // 用于记录当前编辑的行数据
  const currentEditRow = ref<any>(null)
  // 用于区分是新增主菜单还是操作栏新增
  const isMainMenuAdd = ref(false)

  const showDialog = (type: string, row: any) => {
    showModel('menu', row, false)
  }

  const handleChange = () => {}

  const submitForm = async () => {
    if (!formRef.value) return

    await formRef.value.validate(async (valid) => {
      if (valid) {
        try {
          const menuStore = useMenuStore()

          if (labelPosition.value === 'menu') {
            // 准备菜单数据
            const params: AddMenuParams | EditMenuParams = {
              title: form.title,
              path: form.path,
              name: form.name,
              icon: form.icon,
              color: form.color,
              sort: form.sort,
              isHide: !form.isHidden,
              link: form.link,
              isIframe: form.isIframe,
              keepAlive: form.keepAlive,
              remarks: form.remarks,
              component: form.component,
              showBadge: form.showBadge,
              showTextBadge: form.showTextBadge,
              isHideTab: form.isHideTab,
              isInMainContainer: form.isInMainContainer
            }

            if (isEdit.value && currentEditRow.value) {
              // 编辑菜单
              const editParams: EditMenuParams = {
                ...params,
                id: currentEditRow.value.id
              }
              const res = await MenuApiService.editMenu(editParams)
              if (!res.success) {
                throw new Error(res.message || '编辑菜单失败')
              }
            } else {
              // 新增菜单
              const addParams: AddMenuParams = { ...params }
              if (!isMainMenuAdd.value && currentEditRow.value) {
                addParams.parentId = currentEditRow.value.id
              }

              const res = await MenuApiService.addMenu(addParams)
              if (!res.success) {
                throw new Error(res.message || '新增菜单失败')
              }
            }
          } else {
            // 权限按钮的新增/编辑逻辑 (暂未实现，可以按需补充)
            ElMessage.warning('权限按钮功能暂未接入API')
            return
          }

          ElMessage.success(`${isEdit.value ? '编辑' : '新增'}成功`)
          dialogVisible.value = false
          // 刷新列表数据
          const { menuList: newMenuList, closeLoading } = await menuService.getMenuList(0) // 立即获取最新数据
          menuStore.setMenuList(newMenuList) // 更新 store
          closeLoading() // 关闭加载动画
        } catch (error: any) {
          ElMessage.error(error.message || `${isEdit.value ? '编辑' : '新增'}失败`)
        }
      }
    })
  }

  const showModel = (type: string, row?: any, mainMenuAdd: boolean = false) => {
    console.log('showModel called with row:', JSON.stringify(row || {}))
    dialogVisible.value = true
    labelPosition.value = type
    isEdit.value = !!row
    isMainMenuAdd.value = mainMenuAdd
    currentEditRow.value = row
    resetForm()

    if (isEdit.value && type === 'menu') {
      nextTick(() => {
        console.log(
          'Inside nextTick, currentEditRow data:',
          JSON.stringify(currentEditRow.value || {})
        )
        try {
          form.title = formatMenuTitle(currentEditRow.value.meta?.title)
          form.path = currentEditRow.value.path
          form.name = currentEditRow.value.name
          form.icon = currentEditRow.value.meta?.icon
          form.color = currentEditRow.value.meta?.color || null
          form.sort = currentEditRow.value.sort || 1
          form.keepAlive = currentEditRow.value.meta?.keepAlive ?? true
          form.isHidden =
            currentEditRow.value.meta?.isHide !== undefined
              ? !currentEditRow.value.meta.isHide
              : true
          form.link = currentEditRow.value.meta?.link || ''
          form.isIframe = currentEditRow.value.meta?.isIframe || false

          const remarksValue = currentEditRow.value.remarks || ''
          console.log('Value fetched for remarks:', remarksValue)
          form.remarks = remarksValue
          console.log('form.remarks after assignment:', form.remarks)

          form.component = currentEditRow.value.component || ''
          form.showBadge = currentEditRow.value.meta?.showBadge || false
          form.showTextBadge = currentEditRow.value.meta?.showTextBadge || ''
          form.isHideTab = currentEditRow.value.meta?.isHideTab || false
          form.isInMainContainer = currentEditRow.value.meta?.isInMainContainer ?? true
        } catch (e) {
          console.error('Error during form data assignment in nextTick:', e)
        }
      })
    }
  }

  const resetForm = () => {
    formRef.value?.resetFields()
    isMainMenuAdd.value = false
    Object.assign(form, {
      title: '',
      path: '',
      name: '',
      icon: '',
      color: null,
      sort: 1,
      isMenu: true,
      keepAlive: true,
      isHidden: true,
      link: '',
      isIframe: false,
      remarks: '',
      component: '',
      showBadge: false,
      showTextBadge: '',
      isHideTab: false,
      isInMainContainer: true,
      authName: '',
      authLabel: '',
      authIcon: '',
      authSort: 1
    })
  }

  const deleteMenu = async () => {
    try {
      await ElMessageBox.confirm('确定要删除该菜单吗？删除后无法恢复', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })

      ElMessage.success('删除成功')
    } catch (error) {
      if (error !== 'cancel') {
        ElMessage.error('删除失败')
      }
    }
  }

  const deleteAuth = async () => {
    try {
      await ElMessageBox.confirm('确定要删除该权限吗？删除后无法恢复', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })

      ElMessage.success('删除成功')
    } catch (error) {
      if (error !== 'cancel') {
        ElMessage.error('删除失败')
      }
    }
  }

  // 修改计算属性，增加锁定控制参数
  const disableMenuType = computed(() => {
    if (isEdit.value && labelPosition.value === 'button') return true
    if (isEdit.value && labelPosition.value === 'menu') return true
    if (!isEdit.value && labelPosition.value === 'menu' && isMainMenuAdd.value) return true
    return false
  })
</script>

<style lang="scss" scoped>
  .page-content {
    .svg-icon {
      width: 1.8em;
      height: 1.8em;
      overflow: hidden;
      vertical-align: -8px;
      fill: currentcolor;
    }

    :deep(.small-btn) {
      height: 30px !important;
      padding: 0 10px !important;
      font-size: 12px !important;
    }

    .full-width-color-picker {
      width: 100%;

      :deep(.el-color-picker__trigger) {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        height: 32px;
        padding: 0 12px;
        border-radius: 4px;
      }

      :deep(.el-color-picker__color) {
        border-radius: 3px;
      }
    }
  }
</style>
