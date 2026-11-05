import { onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Message, Modal, Form, type FileItem } from '@arco-design/web-vue'
import {
  createDataset,
  deleteDataset,
  getDataset,
  getDatasetsWithPage,
  updateDataset,
} from '@/services/dataset'
import type { GetDatasetsWithPageResponse, GetDatasetResponse } from '@/models/dataset'
import { useDeleteWithConfirm } from './use-common'

type DatasetItem = GetDatasetsWithPageResponse['data']['list'][number]

const defaultPaginator = {
  current_page: 1,
  page_size: 20,
  total_page: 0,
  total_record: 0,
}

export const useGetDatasetsWithPage = () => {
  const route = useRoute()
  const loading = ref(false)
  const datasets = reactive<DatasetItem[]>([])
  const paginator = reactive({ ...defaultPaginator })

  const loadDatasets = async (init: boolean = false) => {
    if (init) {
      Object.assign(paginator, { ...defaultPaginator })
    } else if (paginator.current_page > paginator.total_page) {
      return
    }

    try {
      loading.value = true
      const resp = await getDatasetsWithPage(
        paginator.current_page,
        paginator.page_size,
        String(route.query?.search ?? ''),
      )
      const data = resp.data

      paginator.current_page = data.paginator.current_page
      paginator.page_size = data.paginator.page_size
      paginator.total_page = data.paginator.total_page
      paginator.total_record = data.paginator.total_record

      if (paginator.current_page <= paginator.total_page) {
        paginator.current_page += 1
      }

      if (init) {
        datasets.splice(0, datasets.length, ...data.list)
      } else {
        datasets.push(...data.list)
      }
    } catch {
      Message.error('加载知识库列表失败')
    } finally {
      loading.value = false
    }
  }

  onMounted(async () => {
    await loadDatasets(true)
  })

  watch(
    () => route.query?.search,
    async () => {
      await loadDatasets(true)
    },
  )

  return { loading, datasets, paginator, loadDatasets }
}

export const useDeleteDataset = () =>
  useDeleteWithConfirm(
    '要删除知识库吗?',
    '删除知识库后，关联该知识库的应用将无法再使用该知识库，所有的提示配置和文档都将被永久删除',
    () => deleteDataset(''),
  )

export const useDeleteDatasetWithId = () => {
  const handleDelete = (dataset_id: string, callback?: () => void) => {
    Modal.warning({
      title: '要删除知识库吗?',
      content:
        '删除知识库后，关联该知识库的应用将无法再使用该知识库，所有的提示配置和文档都将被永久删除',
      hideCancel: false,
      onOk: async () => {
        try {
          const resp = await deleteDataset(dataset_id)
          Message.success(resp.message)
        } catch {
          Message.error('删除失败')
        } finally {
          callback?.()
        }
      },
    })
  }
  return { handleDelete }
}

export const useCreateOrUpdateDataset = () => {
  const loading = ref(false)
  const defaultForm = {
    fileList: [] as FileItem[],
    icon: '',
    name: '',
    description: '',
  }
  const form = reactive({ ...defaultForm })
  const formRef = ref<InstanceType<typeof Form>>()
  const showUpdateModal = ref(false)

  const updateShowUpdateModal = (new_value: boolean, callback?: () => void) => {
    showUpdateModal.value = new_value
    callback?.()
  }

  const saveDataset = async (dataset_id?: string) => {
    try {
      loading.value = true
      if (dataset_id !== undefined && dataset_id !== '') {
        const resp = await updateDataset(dataset_id, {
          icon: form.icon,
          name: form.name,
          description: form.description,
        })
        Message.success(resp.message)
      } else {
        const resp = await createDataset({
          icon: form.icon,
          name: form.name,
          description: form.description,
        })
        Message.success(resp.message)
      }
    } catch {
      Message.error('保存失败')
    } finally {
      loading.value = false
    }
  }

  return { loading, form, formRef, saveDataset, showUpdateModal, updateShowUpdateModal }
}

export const useGetDataset = (dataset_id: string) => {
  const loading = ref(false)
  const dataset = reactive<GetDatasetResponse['data']>({
    id: '',
    icon: '',
    name: '',
    description: '',
    document_count: 0,
    hit_count: 0,
    character_count: 0,
    created_at: '',
    updated_at: null,
  })

  const loadDataset = async (id: string) => {
    try {
      loading.value = true
      const resp = await getDataset(id)
      Object.assign(dataset, { ...resp.data })
    } catch {
      Message.error('加载知识库详情失败')
    } finally {
      loading.value = false
    }
  }

  onMounted(() => loadDataset(dataset_id))

  return { loading, dataset, loadDataset }
}
