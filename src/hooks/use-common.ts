import { Message, Modal } from '@arco-design/web-vue'
import { type BaseResponse } from '@/models/base'

export function useDeleteWithConfirm(
  title: string,
  content: string,
  apiCall: () => Promise<BaseResponse<unknown>>,
) {
  const handleDelete = (callback?: () => void) => {
    Modal.warning({
      title,
      content,
      hideCancel: false,
      onOk: async () => {
        try {
          const resp = await apiCall()
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

export function useToggleEnabled(apiCall: () => Promise<BaseResponse<unknown>>) {
  const handleUpdate = async (callback?: () => void) => {
    try {
      const resp = await apiCall()
      Message.success(resp.message)
    } catch {
      Message.error('操作失败')
    } finally {
      callback?.()
    }
  }
  return { handleUpdate }
}
