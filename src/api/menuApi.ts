import { fourDotsSpinnerSvg } from '@/assets/svg/loading'
import request from '@/utils/http'
import { BaseResult } from '@/types/axios'
// import { asyncRoutes } from '@/router/modules/asyncRoutes'
import { MenuListType } from '@/types/menu'
import { processRoute } from '@/utils/menu'
import { ElLoading } from 'element-plus'
import { useUserStore } from '@/store/modules/user'
import { ElMessage } from 'element-plus'

// 菜单接口
export const menuService = {
  // 获取菜单列表，模拟网络请求
  async getMenuList(
    delay: number = 300
  ): Promise<{ menuList: MenuListType[]; closeLoading: () => void }> {
    try {
      // 获取到的菜单数据
      // const menuList = asyncRoutes
      const response = await request.get<BaseResult<MenuListType[]>>({
        url: '/api/admin/user/currentMenu'
      })
      const menuList = response.data || []
      if (!Array.isArray(menuList)) {
        const userStore = useUserStore()
        ElMessage.error('用户菜单获取失败，请重新登录')
        userStore.logOut()
        return {
          menuList: [],
          closeLoading: () => {}
        }
      }
      // 处理后的菜单数据
      const processedMenuList: MenuListType[] = menuList.map((route: MenuListType) =>
        processRoute(route)
      )

      const loading = ElLoading.service({
        lock: true,
        background: 'rgba(0, 0, 0, 0)',
        svg: fourDotsSpinnerSvg,
        svgViewBox: '0 0 40 40'
      })

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            menuList: processedMenuList,
            closeLoading: () => loading.close()
          })
        }, delay)
      })
    } catch (error) {
      console.error('获取菜单列表失败:', error)
      return {
        menuList: [],
        closeLoading: () => {}
      }
    }
  }
}
