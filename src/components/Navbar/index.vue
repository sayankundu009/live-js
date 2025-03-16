<template>
  <nav class="navbar" :class="{ 'disabled': props.isDisabled }">
    <div class="file-tabs-container">
      <div class="file-tabs">
        <transition-group name="fade-slide">
          <div v-for="(file, index) in files" :key="index" :class="['tab', { active: activeFile.id === file.id }]" @click="selectFile(file.id)">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 256 256">
              <g fill="none">
                <rect width="256" height="256" fill="#F0DB4F" rx="60" />
                <path fill="#323330" d="m67.312 213.932l19.59-11.856c3.78 6.701 7.218 12.371 15.465 12.371c7.905 0 12.889-3.092 12.889-15.12v-81.798h24.058v82.138c0 24.917-14.606 36.259-35.916 36.259c-19.245 0-30.416-9.967-36.087-21.996m85.07-2.576l19.588-11.341c5.157 8.421 11.859 14.607 23.715 14.607c9.969 0 16.325-4.984 16.325-11.858c0-8.248-6.53-11.17-17.528-15.98l-6.013-2.579c-17.357-7.388-28.871-16.668-28.871-36.258c0-18.044 13.748-31.792 35.229-31.792c15.294 0 26.292 5.328 34.196 19.247l-18.731 12.029c-4.125-7.389-8.591-10.31-15.465-10.31c-7.046 0-11.514 4.468-11.514 10.31c0 7.217 4.468 10.139 14.778 14.608l6.014 2.577c20.449 8.765 31.963 17.699 31.963 37.804c0 21.654-17.012 33.51-39.867 33.51c-22.339 0-36.774-10.654-43.819-24.574" />
              </g>
            </svg>
            <span v-if="editingFileId !== file.id" @dblclick="startRename(file.id)" title="Double click to rename">{{ trimFileName(file.name) }}</span>
            <input v-else ref="renameInput" autofocus v-model="newFileName" @blur="finishRename" @keyup.enter="finishRename" @keyup.esc="cancelRename" type="text" class="rename-input" />
            <span class="close-tab" @click.stop="closeFile(file.id)">&times;</span>
          </div>
        </transition-group>
        <button class="new-file-btn" title="New File" @click="createNewFile">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M12 21q-.425 0-.712-.288T11 20v-7H4q-.425 0-.712-.288T3 12t.288-.712T4 11h7V4q0-.425.288-.712T12 3t.713.288T13 4v7h7q.425 0 .713.288T21 12t-.288.713T20 13h-7v7q0 .425-.288.713T12 21" /></svg>
        </button>
      </div>
    </div>

    <div class="actions">
      <button class="action-btn" title="Run code" @click="runCode">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M8 19V5l11 7z" /></svg>
      </button>
      <button class="action-btn" title="AI Assistant" @click="toggleAI">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48"><path fill="currentColor" d="M34 6c-1.368 4.944-3.13 6.633-8 8c4.87 1.367 6.632 3.056 8 8c1.368-4.944 3.13-6.633 8-8c-4.87-1.367-6.632-3.056-8-8m-14 8c-2.395 8.651-5.476 11.608-14 14c8.524 2.392 11.605 5.349 14 14c2.395-8.651 5.476-11.608 14-14c-8.524-2.392-11.605-5.349-14-14" /></svg>
      </button>
      <button class="action-btn" title="Format Code" @click="formatCode">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 32 32"><path fill="currentColor" d="M11.427 31.24c0 .422-.339.76-.76.76h-7.62c-1.016 0-1.016-1.526 0-1.526h7.62c.422 0 .76.344.76.766m-.76-3.813H9.141c-1.016 0-1.016 1.526 0 1.526h1.526c1.016 0 1.016-1.526 0-1.526m-7.62 1.526h3.047c1.016 0 1.016-1.526 0-1.526H3.047c-1.016 0-1.016 1.526 0 1.526m7.62-4.573h-7.62c-1.016 0-1.016 1.526 0 1.526h7.62c1.016 0 1.016-1.526 0-1.526m10.666-3.047H7.619c-1.016 0-1.016 1.526 0 1.526h13.714c1.016 0 1.016-1.526 0-1.526M3.047 22.859h1.526c1.016 0 1.016-1.526 0-1.526H3.047c-1.016 0-1.016 1.526 0 1.526m22.859-4.573h-4.573c-1.016 0-1.016 1.521 0 1.521h4.573c1.016 0 1.016-1.521 0-1.521m-13.713 1.521h6.094c1.016 0 1.016-1.521 0-1.521h-6.094c-1.016 0-1.016 1.521 0 1.521m-9.146 0h6.094c1.016 0 1.016-1.521 0-1.521H3.047c-1.016 0-1.016 1.521 0 1.521m24.38-4.567H15.239c-1.016 0-1.016 1.521 0 1.521h12.188c1.016 0 1.016-1.521 0-1.521M12.953 16a.76.76 0 0 0-.76-.76H7.62c-1.016 0-1.016 1.521 0 1.521h4.573a.76.76 0 0 0 .76-.76zm-9.906.76h1.526c1.016 0 1.016-1.521 0-1.521H3.047c-1.016 0-1.016 1.521 0 1.521m25.906-4.567h-7.62c-1.016 0-1.016 1.521 0 1.521h7.62c1.016 0 1.016-1.521 0-1.521M3.047 13.714h7.62c1.016 0 1.016-1.521 0-1.521h-7.62c-1.016 0-1.016 1.521 0 1.521m17.526-3.808c0 .417.339.76.76.76h7.62c1.016 0 1.016-1.526 0-1.526h-7.62a.76.76 0 0 0-.76.766M9.141 9.141c-1.016 0-1.016 1.526 0 1.526h1.526c1.016 0 1.016-1.526 0-1.526zm-6.094 1.526h3.047c1.016 0 1.016-1.526 0-1.526H3.047c-1.016 0-1.016 1.526 0 1.526m22.094-3.808c0 .417.344.76.766.76h1.521c1.016 0 1.016-1.526 0-1.526h-1.521a.76.76 0 0 0-.76.766zm-1.521 0a.766.766 0 0 0-.76-.766h-6.099c-1.016 0-1.016 1.526 0 1.526h6.094a.766.766 0 0 0 .766-.76zM3.047 7.62h10.667c1.016 0 1.016-1.526 0-1.526H3.047c-1.016 0-1.016 1.526 0 1.526m6.859-3.813c0 .422.339.766.76.766h15.24c1.016 0 1.016-1.526 0-1.526h-15.24a.76.76 0 0 0-.76.76m-6.859.766H7.62c1.016 0 1.016-1.526 0-1.526H3.047c-1.016 0-1.016 1.526 0 1.526m0-3.047h18.286c1.016 0 1.016-1.526 0-1.526H3.047c-1.016 0-1.016 1.526 0 1.526" /></svg>
      </button>
    </div>
  </nav>
</template>

<script setup>
import { ref } from "vue";

const props = defineProps({
  files: {
    type: Array,
    required: true,
    default: () => [],
  },
  activeFile: {
    required: true,
  },
  isDisabled: {
    type: Boolean,
    required: false,
    default: false,
  },
});

const emit = defineEmits(["onFileSelect", "onFileAdd", "onFileDelete", "onRunCode", "onFormatCode", "onToggleAi", "onFileRename"]);

const editingFileId = ref(null);
const newFileName = ref("");

function selectFile(fileId) {
  !props.isDisabled && emit("onFileSelect", fileId);
}

function closeFile(fileId) {
  !props.isDisabled && emit("onFileDelete", fileId);
}

function formatCode() {
  !props.isDisabled && emit("onFormatCode");
}

function createNewFile() {
  !props.isDisabled && emit("onFileAdd");
}

function runCode() {
  !props.isDisabled && emit("onRunCode");
}

function toggleAI() {
  !props.isDisabled && emit("onToggleAi");
}

function startRename(fileId) {
  editingFileId.value = fileId;
  const file = props.files.find((f) => f.id === fileId);
  const fileNameWithoutExt = file.name.split(".")[0];

  newFileName.value = fileNameWithoutExt;
}

function finishRename() {
  if (editingFileId.value && newFileName.value.trim()) {
    !props.isDisabled && emit("onFileRename", {
      id: editingFileId.value,
      newName: newFileName.value.trim() + ".js",
    });
  }
  editingFileId.value = null;
}

function cancelRename() {
  editingFileId.value = null;
}

function trimFileName(fileName, maxLength = 20) {
  if (fileName.length <= maxLength) {
    return fileName;
  }

  const extension = fileName.split(".").pop();
  const name = fileName.slice(0, maxLength - 3);

  return `${name}...${extension ? "." + extension : ""}`;
}
</script>

<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #1e1e1e;
  border-bottom: 1px solid #333;
  height: 35px;
}

.disabled {
  cursor: not-allowed;
  pointer-events: none;
}

.file-tabs-container {
  flex: 1;
  overflow-x: auto;
}

.file-tabs-container::-webkit-scrollbar {
  height: 3px;
  cursor: pointer;
}

.file-tabs-container::-webkit-scrollbar-track {
  background: #1e1e1e;
}

.file-tabs-container::-webkit-scrollbar-thumb {
  background: #4a4a4a;
  border-radius: 4px;
}

.file-tabs-container::-webkit-scrollbar-thumb:hover {
  background: #555;
}

.file-tabs {
  display: flex;
  min-width: max-content;
}

.tab {
  padding: 0.5rem 1rem;
  color: #ccc;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: 4px 4px 0 0;
  transition: background-color 0.3s ease;
  width: max-content;
}

.tab.active {
  background-color: #3d3d3d;
  color: #fff;
}

.tab:hover .close-tab {
  opacity: 0.6;
}

.close-tab {
  opacity: 0;
  transition: opacity 0.3s ease;
  font-size: 1.2rem;
}

.close-tab:hover {
  opacity: 1 !important;
}

.actions {
  display: flex;
}

.action-btn {
  background: none;
  border: none;
  color: #ccc;
  padding: 0.5rem;
  cursor: pointer;
  border-radius: 4px;
}

.action-btn:hover {
  background-color: #3d3d3d;
  color: #fff;
  transform: translateY(-1px);
}

.new-file-btn {
  background: none;
  border: none;
  color: #ccc;
  padding: 0.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: transform 0.3s ease;
  transform: scale(0.9);
}

.new-file-btn:hover {
  transform: scale(1);
}

.rename-input {
  background: #1e1e1e;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  padding: 4px 8px;
  border-radius: 6px;
  outline: none;
  font-size: 0.9rem;
  width: 120px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.rename-input:focus {
  border-color: #cd804f;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.1s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>
