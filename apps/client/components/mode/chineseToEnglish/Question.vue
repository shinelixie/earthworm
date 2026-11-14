<template>
  <div class="text-center">
    <div
      v-if="courseStore.currentStatement?.isFragment"
      class="mb-2 mt-10 text-2xl dark:text-gray-50"
    >
      {{ courseStore.currentStatement?.chinese || "（该片段暂无中文释义，按提示拼写）" }}
    </div>
    <div
      v-else
      class="mb-4 mt-10 text-2xl dark:text-gray-50"
    >
      {{ courseStore.currentStatement?.chinese || "生存还是毁灭，这是一个问题" }}
    </div>
    <div
      v-if="courseStore.currentStatement?.hint"
      class="mb-3 text-xs text-purple-500 dark:text-purple-300"
    >
      {{ courseStore.currentStatement.isFragment ? "拆分练习" : "" }}{{ " "
      }}{{ courseStore.currentStatement.hint }}
    </div>
    <MainQuestionInput />
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch } from "vue";

import { useCurrentStatementEnglishSound } from "~/composables/main/englishSound";
import { useAutoPlayEnglish } from "~/composables/user/sound";
import { useCourseStore } from "~/store/course";

const courseStore = useCourseStore();
const { playSound } = useCurrentStatementEnglishSound();
const { isAutoPlayEnglish } = useAutoPlayEnglish();

onMounted(() => {
  handleAutoPlayEnglish();
});

watch(
  () => courseStore.currentStatement,
  () => {
    handleAutoPlayEnglish();
  },
);

function handleAutoPlayEnglish() {
  if (isAutoPlayEnglish()) {
    playSound();
  }
}
</script>
