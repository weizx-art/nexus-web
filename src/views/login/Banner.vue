<script setup lang="ts">
import bannerAiAgent from '@/assets/images/banner-ai-agent.png'
import bannerKnowledgeBase from '@/assets/images/banner-knowledge-base.png'
import bannerSystemIntegration from '@/assets/images/banner-system-integration.png'
import bannerWorkflowAutomation from '@/assets/images/banner-workflow-automation.png'

const carousels = [
  {
    slogan: '智能驱动，高效协同',
    subSlogan: '集成智能交互、任务调度、工具编排与知识问答于一体',
    image: bannerAiAgent,
  },
  {
    slogan: 'RAG 知识库，精准问答',
    subSlogan: '接入 Weaviate 向量数据库，实现企业私有文档智能检索与问答',
    image: bannerKnowledgeBase,
  },
  {
    slogan: '多系统打通，数据融合',
    subSlogan: '打通 OA、EHR、PM 三大业务系统，消除数据壁垒',
    image: bannerSystemIntegration,
  },
  {
    slogan: 'Agent 工作流，自动编排',
    subSlogan: '基于 LangGraph 设计多轮对话状态管理与任务规划',
    image: bannerWorkflowAutomation,
  },
]
</script>

<template>
  <div
    class="w-[550px] flex items-center justify-center bg-gradient-to-tr from-[#1d2129] to-[#00308f]"
  >
    <div class="flex-1 h-full">
      <a-carousel animation-name="fade" class="h-full" :auto-play="true" :interval="5000">
        <a-carousel-item v-for="carousel in carousels" :key="carousel.slogan">
          <div class="flex flex-col items-center justify-center h-full px-10">
            <div class="text-2xl leading-7 font-bold text-gray-100">{{ carousel.slogan }}</div>
            <div class="mt-2 text-gray-400 leading-[22px] text-center">
              {{ carousel.subSlogan }}
            </div>
            <img
              :src="carousel.image"
              alt="综合业务智能Agent"
              class="w-[320px] mt-[30px] rounded-3xl"
            />
          </div>
        </a-carousel-item>
      </a-carousel>
    </div>
  </div>
</template>
