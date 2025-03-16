<template>
  <div class="ai-panel">
    <div class="ai-panel-content">
      <button tabindex="3" class="ai-close" title="Close" @click="!props.loading && emit('onClose')">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
      <textarea tabindex="1" class="ai-input" :placeholder="`${props.loading ? loadingPlaceholder : placeholder}`" :disabled="props.loading" rows="1" v-model="inputText" ref="inputRef" data-gramm="false" data-gramm_editor="false" data-enable-grammarly="false" @keydown="handleKeydown"></textarea>
      <button tabindex="2" class="ai-submit" @click="submit" :disabled="props.loading">
        <template v-if="props.loading">
          <div class="spinner"></div> Loading...
        </template>
        <template v-else>
          Submit
          <kbd>⏎</kbd>
        </template>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";

const emit = defineEmits(["onSubmit", "onClose"]);

const props = defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
});

const inputText = ref("");
const inputRef = ref(null);
const placeholders = [
  "What do you want to create?",
  "What's on your mind?",
  "What's next?",
  "New code instructions...",
  "What's the next step?",
];
const codegenPlaceholders = [
  "Crafting something amazing...",
  "Generating code...",
  "Working its magic...",
  "Building your solution...",
  "Turning ideas into code...",
];
const placeholder = computed(() => placeholders[Math.floor(Math.random() * placeholders.length)]);
const loadingPlaceholder = computed(() => codegenPlaceholders[Math.floor(Math.random() * codegenPlaceholders.length)]);

function handleKeydown(event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    submit();
  }
}

function submit() {
  const value = inputText.value.trim();

  if(value === "") {
    return;
  }

  emit("onSubmit", value);

  inputText.value = "";
}

onMounted(() => {
  inputRef.value.focus();
});
</script>

<style scoped>
.ai-panel {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
}

.ai-panel-content {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background: rgba(30, 30, 30, 0.8);
  padding: 0.75rem;
  padding-bottom: 0;
  border-radius: 8px;
  backdrop-filter: blur(10px);
  border: 1px solid #333;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.ai-input {
  width: 350px;
  background: #252525;
  border: 1px solid #404040;
  color: #fff;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s ease;
  resize: none;
  min-height: 50px;
  line-height: 1.4;
  scrollbar-width: thin;
  scrollbar-color: #404040 #252525;
}

.ai-input::-webkit-scrollbar {
  width: 8px;
}

.ai-input::-webkit-scrollbar-track {
  background: #252525;
  border-radius: 4px;
}

.ai-input::-webkit-scrollbar-thumb {
  background: #404040;
  border-radius: 4px;
}

.ai-input::-webkit-scrollbar-thumb:hover {
  background: #505050;
}

.ai-input:focus {
  border-color: #cd804f;
}

.ai-submit {
  align-self: flex-end;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: #888;
  padding: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  height: 38px;
  border: none;
  background: transparent;
}

.ai-submit:hover {
  color: #cd804f;
}

.ai-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
  color: #888;
}

.ai-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #888;
  padding: 0.5rem;
}

.ai-close {
  position: absolute;
  top: -8px;
  right: -8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #2d2d2d;
  border: 1px solid #404040;
  color: #888;
  padding: 0.25rem;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
}

.ai-close:hover {
  background: #333;
  color: #fff;
  border-color: #cd804f;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #FFF;
  border-bottom-color: transparent;
  border-radius: 50%;
  display: inline-block;
  box-sizing: border-box;
  animation: rotation 1s linear infinite;
}

@keyframes rotation {
  0% {
      transform: rotate(0deg);
  }
  100% {
      transform: rotate(360deg);
  }
} 
</style>
