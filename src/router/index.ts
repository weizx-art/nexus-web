import { createRouter, createWebHistory } from 'vue-router'
import auth from '@/utils/auth'
import DefaultLayout from '@/components/Layout/DefaultLayout.vue'
import BlankLayout from '@/components/Layout/BlankLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: DefaultLayout,
      children: [
        {
          path: '',
          redirect: 'chat',
        },
        {
          path: 'chat',
          name: 'chat',
          component: () => import('@/views/chat/index.vue'),
          meta: { label: '智能对话', icon: 'icon-message', color: 'text-blue-500', sidebar: true },
        },
        {
          path: 'dataset',
          name: 'dataset-list',
          component: () => import('@/views/dataset/index.vue'),
          meta: { label: '知识库', icon: 'icon-storage', color: 'text-emerald-500', sidebar: true },
        },
        {
          path: 'dataset/documents/:dataset_id',
          name: 'dataset-documents-list',
          component: () => import('@/views/dataset/documents/index.vue'),
        },
        {
          path: 'dataset/documents/:dataset_id/create',
          name: 'dataset-documents-create',
          component: () => import('@/views/dataset/documents/CreateView.vue'),
        },
        {
          path: 'dataset/documents/:dataset_id/segments/:document_id',
          name: 'dataset-segments-list',
          component: () => import('@/views/dataset/segments/index.vue'),
        },
      ],
    },
    {
      path: '/',
      component: BlankLayout,
      children: [
        {
          path: 'login',
          name: 'login',
          component: () => import('@/views/login/index.vue'),
        },
        {
          path: 'register',
          name: 'register',
          component: () => import('@/views/login/index.vue'),
        },
      ],
    },
  ],
})

router.beforeEach(async (to) => {
  const publicRoutes: string[] = ['login', 'register']
  const routeName = typeof to.name === 'string' ? to.name : ''
  if (!auth.isLogin() && !publicRoutes.includes(routeName)) {
    return { path: '/login' }
  }
})

export default router
