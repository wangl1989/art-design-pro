<template>
  <div class="page-content user">
    <div class="content">
      <div class="left-wrap">
        <div class="user-wrap box-style">
          <img class="bg" src="@imgs/user/bg.png" />
          <img class="avatar" :src="formatAvatar(userDetail.icon, userDetail.id)" />
          <h2 class="name">{{ userDetail.nickName || userInfo.username }}</h2>
          <p class="des">{{ form.des || 'Art Design Pro 是一款漂亮的后台管理系统模版.' }}</p>

          <div class="outer-info">
            <div>
              <i class="iconfont-sys">&#xe72e;</i>
              <span>{{ userDetail.email || 'email@example.com' }}</span>
            </div>
            <div>
              <i class="iconfont-sys">&#xe608;</i>
              <span>
                {{
                  userDetail.roles && userDetail.roles.length > 0
                    ? userDetail.roles[0].name
                    : '未分配角色'
                }}
              </span>
            </div>
            <div>
              <i class="iconfont-sys">&#xe736;</i>
              <span>{{ form.location }}</span>
            </div>
            <div>
              <i class="iconfont-sys">&#xe811;</i>
              <span>{{ userDetail.remarks }}</span>
            </div>
          </div>

          <div class="lables">
            <h3>标签</h3>
            <div>
              <div v-for="item in lableList" :key="item">
                {{ item }}
              </div>
            </div>
          </div>
        </div>

        <!-- <el-carousel class="gallery" height="160px"
          :interval="5000"
          indicator-position="none"
        >
          <el-carousel-item class="item" v-for="item in galleryList" :key="item">
            <img :src="item"/>
          </el-carousel-item>
        </el-carousel> -->
      </div>
      <div class="right-wrap">
        <div class="info box-style">
          <h1 class="title">基本设置</h1>

          <el-form
            :model="form"
            class="form"
            ref="ruleFormRef"
            :rules="rules"
            label-width="86px"
            label-position="top"
          >
            <el-row>
              <el-form-item label="登录账号" prop="loginName">
                <el-input v-model="form.loginName" disabled />
              </el-form-item>
              <el-form-item label="角色" class="right-input">
                <div class="role-tags">
                  <el-tag
                    v-for="role in userDetail.roles"
                    :key="role.id"
                    type="success"
                    effect="light"
                  >
                    {{ role.name }}
                  </el-tag>
                </div>
              </el-form-item>
            </el-row>

            <el-row>
              <el-form-item label="昵称" prop="nickName">
                <el-input v-model="form.nickName" :disabled="!isEdit" />
              </el-form-item>
              <el-form-item label="邮箱" prop="email" class="right-input">
                <el-input v-model="form.email" :disabled="!isEdit" />
              </el-form-item>
            </el-row>

            <el-row>
              <el-form-item label="手机" prop="tel">
                <el-input v-model="form.tel" :disabled="!isEdit" />
              </el-form-item>
              <el-form-item label="地址" prop="location" class="right-input">
                <el-input v-model="form.location" :disabled="!isEdit">
                  <template #suffix>
                    <i
                      class="iconfont-sys location-icon"
                      v-if="isEdit"
                      @click="getLocation"
                      title="获取当前位置"
                      >&#xe736;</i
                    >
                  </template>
                </el-input>
              </el-form-item>
            </el-row>

            <el-form-item label="个人介绍" prop="des" :style="{ height: '130px' }">
              <el-input type="textarea" :rows="4" v-model="form.des" :disabled="!isEdit" />
            </el-form-item>

            <div class="el-form-item-right">
              <el-button type="primary" style="width: 90px" v-ripple @click="edit">
                {{ isEdit ? '保存' : '编辑' }}
              </el-button>
            </div>
          </el-form>
        </div>

        <div class="info box-style" style="margin-top: 20px">
          <h1 class="title">更改密码</h1>

          <el-form
            :model="pwdForm"
            class="form"
            label-width="86px"
            label-position="top"
            ref="pwdFormRef"
            :rules="pwdRules"
          >
            <el-form-item label="当前密码" prop="password">
              <el-input
                v-model="pwdForm.password"
                :type="passwordVisible.current ? 'text' : 'password'"
                :disabled="!isEditPwd"
              >
                <template #suffix>
                  <el-icon
                    class="password-eye"
                    @click="passwordVisible.current = !passwordVisible.current"
                    v-if="isEditPwd"
                  >
                    <el-icon-view v-if="passwordVisible.current" />
                    <el-icon-hide v-else />
                  </el-icon>
                </template>
              </el-input>
            </el-form-item>

            <el-form-item label="新密码" prop="newPassword">
              <el-input
                v-model="pwdForm.newPassword"
                :type="passwordVisible.new ? 'text' : 'password'"
                :disabled="!isEditPwd"
              >
                <template #suffix>
                  <el-icon
                    class="password-eye"
                    @click="passwordVisible.new = !passwordVisible.new"
                    v-if="isEditPwd"
                  >
                    <el-icon-view v-if="passwordVisible.new" />
                    <el-icon-hide v-else />
                  </el-icon>
                </template>
              </el-input>
            </el-form-item>

            <el-form-item label="确认新密码" prop="confirmPassword">
              <el-input
                v-model="pwdForm.confirmPassword"
                :type="passwordVisible.confirm ? 'text' : 'password'"
                :disabled="!isEditPwd"
              >
                <template #suffix>
                  <el-icon
                    class="password-eye"
                    @click="passwordVisible.confirm = !passwordVisible.confirm"
                    v-if="isEditPwd"
                  >
                    <el-icon-view v-if="passwordVisible.confirm" />
                    <el-icon-hide v-else />
                  </el-icon>
                </template>
              </el-input>
            </el-form-item>

            <div class="el-form-item-right">
              <el-button type="primary" style="width: 90px" v-ripple @click="editPwd">
                {{ isEditPwd ? '保存' : '编辑' }}
              </el-button>
            </div>
          </el-form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useUserStore } from '@/store/modules/user'
  import { FormInstance, FormRules } from 'element-plus'
  import { UserService } from '@/api/usersApi'
  import { UserDetailResponse } from '@/api/model/userModel'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { View as ElIconView, Hide as ElIconHide } from '@element-plus/icons-vue'

  const userStore = useUserStore()
  const userInfo = computed(() => userStore.getUserInfo)
  const userDetail = ref<UserDetailResponse>({} as UserDetailResponse)
  const loading = ref(false)

  const isEdit = ref(false)
  const isEditPwd = ref(false)
  const date = ref('')
  const form = reactive({
    loginName: '',
    nickName: '',
    email: '',
    tel: '',
    location: '',
    des: ''
  })

  const pwdForm = reactive({
    password: '',
    newPassword: '',
    confirmPassword: ''
  })

  // 控制密码显示/隐藏状态
  const passwordVisible = reactive({
    current: false,
    new: false,
    confirm: false
  })

  const ruleFormRef = ref<FormInstance>()
  const pwdFormRef = ref<FormInstance>()

  const rules = reactive<FormRules>({
    loginName: [],
    nickName: [
      { required: true, message: '请输入昵称', trigger: 'blur' },
      { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
    ],
    email: [],
    tel: [],
    location: [],
    des: []
  })

  // 密码表单校验规则
  const pwdRules = reactive<FormRules>({
    password: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
    newPassword: [
      { required: true, message: '请输入新密码', trigger: 'blur' },
      {
        validator: (rule, value, callback) => {
          if (!value) {
            callback(new Error('请输入新密码'))
            return
          }

          // 使用正则表达式检查密码
          const isValid = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d\W_]{8,20}$/.test(value)
          console.log('密码验证结果:', value, isValid)

          if (!isValid) {
            callback(
              new Error('密码必须包含8-20个字符，至少包含一个大写字母、一个小写字母和一个数字')
            )
            return
          }

          callback()
        },
        trigger: 'blur'
      }
    ],
    confirmPassword: [
      { required: true, message: '请确认新密码', trigger: 'blur' },
      {
        validator: (rule, value, callback) => {
          if (!value) {
            callback(new Error('请确认新密码'))
            return
          }

          if (value !== pwdForm.newPassword) {
            callback(new Error('两次输入的密码不一致'))
            return
          }

          callback()
        },
        trigger: 'blur'
      }
    ]
  })

  const lableList: Array<string> = ['专注设计', '很有想法', '辣~', '大长腿', '川妹子', '海纳百川']

  onMounted(async () => {
    getDate()
    await fetchUserDetail()
  })

  // 获取用户详情
  const fetchUserDetail = async () => {
    loading.value = true
    try {
      const res = await UserService.getCurrentUser()
      if (res.success) {
        userDetail.value = res.data

        // 初始化表单数据
        form.loginName = res.data.loginName || ''
        form.nickName = res.data.nickName || ''
        form.email = res.data.email || ''
        form.tel = res.data.tel || ''
        form.des = res.data.remarks || ''
        form.location = res.data.location || ''
      } else {
        ElMessage.error(res.message || '获取用户信息失败')
      }
    } catch (error) {
      console.error('获取用户详情失败:', error)
      ElMessage.error('获取用户详情失败')
    } finally {
      loading.value = false
    }
  }

  // 获取用户详细信息（包括敏感信息）
  const fetchDetailForEdit = async (userId: number) => {
    loading.value = true
    try {
      const res = await UserService.getUserDetail(userId)
      if (res.success) {
        const userData = res.data

        // 更新表单数据，使用完整的未加密信息
        form.loginName = userData.loginName || ''
        form.nickName = userData.nickName || ''
        form.email = userData.email || ''
        form.tel = userData.tel || ''
        form.des = userData.remarks || ''
        form.location = userData.location || ''

        isEdit.value = true
      } else {
        ElMessage.error(res.message || '获取用户详细信息失败')
      }
    } catch (error) {
      console.error('获取用户详细信息失败:', error)
      ElMessage.error('获取用户详细信息失败')
    } finally {
      loading.value = false
    }
  }

  const getDate = () => {
    const d = new Date()
    const h = d.getHours()
    let text = ''

    if (h >= 6 && h < 9) {
      text = '早上好'
    } else if (h >= 9 && h < 11) {
      text = '上午好'
    } else if (h >= 11 && h < 13) {
      text = '中午好'
    } else if (h >= 13 && h < 18) {
      text = '下午好'
    } else if (h >= 18 && h < 24) {
      text = '晚上好'
    } else if (h >= 0 && h < 6) {
      text = '很晚了，早点睡'
    }

    date.value = text
  }

  // 处理头像URL
  const formatAvatar = (icon: string, userId: number) => {
    if (!icon || icon === '' || !icon.startsWith('http')) {
      return `https://api.dicebear.com/9.x/adventurer/svg?seed=${userId}`
    }
    return icon
  }

  // 获取用户位置
  const getLocation = async () => {
    if (!isEdit.value) return

    try {
      ElMessage.info('正在获取位置...')
      const res = await UserService.getUserLocation()
      if (res.success) {
        const locationData = res.data
        // 拼接地址
        const fullAddress = [
          locationData.province || '',
          locationData.city || '',
          locationData.district || ''
        ]
          .filter(Boolean)
          .join('')

        // 更新location字段
        form.location = fullAddress

        ElMessage.success('位置获取成功')
      } else {
        ElMessage.error(res.message || '获取位置失败')
      }
    } catch (error) {
      console.error('获取位置失败:', error)
      ElMessage.error('获取位置失败')
    }
  }

  const edit = async () => {
    if (isEdit.value) {
      // 保存编辑内容
      if (ruleFormRef.value) {
        await ruleFormRef.value.validate(async (valid) => {
          if (valid) {
            try {
              // 检查邮箱和手机号是否包含*号，如果有则提交空值
              const email = form.email && form.email.includes('*') ? '' : form.email
              const tel = form.tel && form.tel.includes('*') ? '' : form.tel

              const params = {
                nickName: form.nickName,
                email: email,
                tel: tel,
                remarks: form.des,
                location: form.location
              }

              const res = await UserService.updateCurrentUserInfo(params)
              if (res.success) {
                ElMessage.success('更新成功')
                await fetchUserDetail() // 重新获取用户信息
                isEdit.value = false
              } else {
                ElMessage.error(res.message || '更新失败')
              }
            } catch (error) {
              console.error('更新用户信息失败:', error)
              ElMessage.error('更新用户信息失败')
            }
          }
        })
      }
    } else {
      // 编辑模式：先获取用户详细信息（包括敏感信息）
      if (userDetail.value.id) {
        await fetchDetailForEdit(userDetail.value.id)
      } else {
        ElMessage.error('无法获取用户ID，请刷新页面后重试')
      }
    }
  }

  // 清空密码表单
  const resetPwdForm = () => {
    pwdForm.password = ''
    pwdForm.newPassword = ''
    pwdForm.confirmPassword = ''
    // 如果表单实例存在，重置校验状态
    if (pwdFormRef.value) {
      pwdFormRef.value.resetFields()
    }
  }

  // 编辑/保存密码
  const editPwd = async () => {
    if (isEditPwd.value) {
      // 保存密码
      if (pwdFormRef.value) {
        await pwdFormRef.value.validate(async (valid) => {
          if (valid) {
            try {
              const params = {
                oldPwd: pwdForm.password,
                newPwd: pwdForm.newPassword
              }

              const res = await UserService.changePassword(params)
              if (res.success) {
                ElMessage.success('密码修改成功')
                isEditPwd.value = false
                resetPwdForm()

                // 密码修改成功后倒计时登出
                let countdown = 5
                const messageContent = `密码已成功修改！${countdown}秒后将退出系统，请使用新密码重新登录。`

                ElMessageBox.alert(messageContent, '密码已修改', {
                  confirmButtonText: '立即退出',
                  showClose: false,
                  beforeClose: (action, instance, done) => {
                    // 用户点击了立即退出按钮
                    clearInterval(timer)
                    userStore.logOut()
                    done()
                  }
                })

                const timer = setInterval(() => {
                  countdown--
                  if (countdown <= 0) {
                    clearInterval(timer)
                    userStore.logOut()
                  } else {
                    // 更新消息框内容
                    const messageEl = document.querySelector('.el-message-box__message p')
                    if (messageEl) {
                      messageEl.textContent = `密码已成功修改！${countdown}秒后将退出系统，请使用新密码重新登录。`
                    }
                  }
                }, 1000)
              } else {
                ElMessage.error(res.message || '密码修改失败')
              }
            } catch (error) {
              console.error('密码修改失败:', error)
              ElMessage.error('密码修改失败')
            }
          }
        })
      }
    } else {
      // 进入编辑模式，确保表单为空
      resetPwdForm()
      // 重置密码显示/隐藏状态
      passwordVisible.current = false
      passwordVisible.new = false
      passwordVisible.confirm = false
      isEditPwd.value = true
    }
  }

  // 当退出编辑模式时，确保密码表单清空
  watch(isEditPwd, (newVal) => {
    if (!newVal) {
      resetPwdForm()
    }
  })
</script>

<style lang="scss">
  .user {
    .icon {
      width: 1.4em;
      height: 1.4em;
      overflow: hidden;
      vertical-align: -0.15em;
      fill: currentcolor;
    }
  }
</style>

<style lang="scss" scoped>
  .page-content {
    width: 100%;
    height: 100%;
    padding: 0 !important;
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;

    $box-radius: calc(var(--custom-radius) + 4px);

    .box-style {
      border: 1px solid var(--art-border-color);
    }

    .content {
      position: relative;
      display: flex;
      justify-content: space-between;
      margin-top: 10px;

      .left-wrap {
        width: 450px;
        margin-right: 25px;

        .user-wrap {
          position: relative;
          height: 600px;
          padding: 35px 40px;
          overflow: hidden;
          text-align: center;
          background: var(--art-main-bg-color);
          border-radius: $box-radius;

          .bg {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 200px;
            object-fit: cover;
          }

          .avatar {
            position: relative;
            z-index: 10;
            width: 80px;
            height: 80px;
            margin-top: 120px;
            object-fit: cover;
            border: 2px solid #fff;
            border-radius: 50%;
          }

          .name {
            margin-top: 20px;
            font-size: 22px;
            font-weight: 400;
          }

          .des {
            margin-top: 20px;
            font-size: 14px;
          }

          .outer-info {
            width: 300px;
            margin: auto;
            margin-top: 30px;
            text-align: left;

            > div {
              margin-top: 10px;

              span {
                margin-left: 8px;
                font-size: 14px;
              }
            }
          }

          .lables {
            margin-top: 40px;

            h3 {
              font-size: 15px;
              font-weight: 500;
            }

            > div {
              display: flex;
              flex-wrap: wrap;
              justify-content: center;
              margin-top: 15px;

              > div {
                padding: 3px 6px;
                margin: 0 10px 10px 0;
                font-size: 12px;
                background: var(--art-main-bg-color);
                border: 1px solid var(--art-border-color);
                border-radius: 2px;
              }
            }
          }
        }

        .gallery {
          margin-top: 25px;
          border-radius: 10px;

          .item {
            img {
              width: 100%;
              height: 100%;
              object-fit: cover;
            }
          }
        }
      }

      .right-wrap {
        flex: 1;
        overflow: hidden;
        border-radius: $box-radius;

        .info {
          background: var(--art-main-bg-color);
          border-radius: $box-radius;

          .title {
            padding: 15px 25px;
            font-size: 20px;
            font-weight: 400;
            color: var(--art-text-gray-800);
            border-bottom: 1px solid var(--art-border-color);
          }

          .form {
            box-sizing: border-box;
            padding: 30px 25px;

            > .el-row {
              .el-form-item {
                width: calc(50% - 10px);
              }

              .el-input,
              .el-select {
                width: 100%;
              }
            }

            .right-input {
              margin-left: 20px;
            }

            .el-form-item-right {
              display: flex;
              align-items: center;
              justify-content: end;

              .el-button {
                width: 110px !important;
              }
            }

            .role-tags {
              display: flex;
              flex-wrap: wrap;
              gap: 5px;
              padding-top: 5px;
            }
          }
        }
      }
    }
  }

  // 位置图标样式
  .location-icon {
    font-size: 18px;
    color: var(--el-color-primary);
    cursor: pointer;
    transition: color 0.3s;

    &:hover {
      color: var(--el-color-primary-light-3);
    }
  }

  // 密码输入框的眼睛图标样式
  .password-eye {
    margin-right: 8px;
    color: var(--el-text-color-secondary);
    cursor: pointer;

    &:hover {
      color: var(--el-color-primary);
    }
  }

  @media only screen and (max-width: $device-ipad-vertical) {
    .page-content {
      .content {
        display: block;
        margin-top: 5px;

        .left-wrap {
          width: 100%;
        }

        .right-wrap {
          width: 100%;
          margin-top: 15px;
        }
      }
    }
  }
</style>
