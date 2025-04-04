<script setup>
import Navbar from "./components/Navbar/index.vue";
import Editor from "./components/Editor/index.vue";
import AiPanel from "./components/AiPanel/index.vue";
import Loading from "./components/Loading/index.vue";
import { transform } from "@babel/standalone";
import { customLogTransformPlugin, infiniteLoopSafetyPlugin } from "./utils/babel";
import { generateCode } from "./utils/ai";
import { debounce, diffLines } from "./utils";
import { ref, onMounted } from "vue";

const inputCode = `for (let index = 0; index < 5; index++) {
  console.log(index);
}

setTimeout(() => {
  console.log({message: "Hello world!"})
}, 1000);

console.log("Another message");`.trim();

const debounceFunction = debounce((callback) => callback(), 1500);

function customLogFunction(lineNumber, ...args) {
  const text = args.map((arg) =>{
    let value;

    // TODO:Handle DOM elements

    switch (typeof arg) {
      case "number":
      case "string":
        value = String(arg);
        break;
      case "undefined":
        value = "undefined";
        break;
      case "function":
        value = `function ${arg.name || "anonymous"}() { [native code] }`;
        break;
      default:
        value = JSON.stringify(arg);
    }

    if(!value.trim()){
      value = `" "`;
    }

    value = value.replaceAll("'", '"');

    return value;
  }).join(" ");

  editorRef.value.addTextAboveLine({
    line: lineNumber,
    text,
    type: "log",
  });
}

function onError(error, line) {
  console.log(error);

  const lineNumber = line ?? error.loc?.line ?? (error.message?.match(/\((\d+):\d+\)/) ?? [, 1])[1];

  const message = error.message ?? error.toString();

  const text = message.replaceAll("'", '"');

  requestAnimationFrame(() => {
    editorRef.value.addTextAboveLine({
      line: lineNumber,
      text,
      type: "error",
    });
  });

  cleanupAsyncOperations();
}

function cleanupAsyncOperations() {
  if (timeoutIds.length) {
    timeoutIds.forEach(window.clearTimeout);
    timeoutIds = [];
  }
  if (intervalIds.length) {
    intervalIds.forEach(window.clearInterval); 
    intervalIds = [];
  }
  if (controllers.length) {
    controllers.forEach(controller => controller.abort());
    controllers = [];
  }
}

function setupAsyncOperations({windowInstance}) {
  const setTimeout = (callback, delay, ...args) => {
    const id = windowInstance.setTimeout(callback, delay, ...args);

    timeoutIds.push(id);

    return id;
  };

  const setInterval = (callback, delay, ...args) => {
    const id = windowInstance.setInterval(callback, delay, ...args);

    intervalIds.push(id);

    return id;
  };

  const fetch = (url, options = {}) => {
    const controller = new AbortController();

    controllers.push(controller);

    return windowInstance.fetch(url, {
      ...options,
      signal: controller.signal,
    });
  };

  return {
    setTimeout,
    setInterval,
    fetch,
  };
}

function evaluate(code) {
  if (code.trim() === "") {
    return;
  }

  try {
    const transformedCode = transform(code, {
      plugins: [customLogTransformPlugin, infiniteLoopSafetyPlugin],
      sourceType: "script",
    }).code;

    window.transformedCode = transformedCode;
    
    iframeRef.value.contentDocument.body.innerHTML = ``;

    requestIdleCallback(() => {
      const windowInstance = iframeRef.value.contentWindow;

      try {
        new windowInstance.Function(
          ["$data"],
          `
           with($data) { 
            (() => {
              try {
                ${transformedCode} 
              } catch(error) {
                onError(error);
              }
            })()
           }
        `,
        )({
          customLogFunction,
          onError,
          ...setupAsyncOperations({windowInstance}),
        });
      } catch (error) {
        onError(error);
      }
    })
  } catch (error) {
    onError(error);
  }
}

function editorCleanup() {
  cleanupAsyncOperations();

  editorRef.value.clearDecorations();
}

function executeCode() {
  editorCleanup();

  if (!activeFile.value) {
    return;
  }

  debounceFunction(() => {
    evaluate(activeFile.value.content);
  });
}

function onChange({ content }) {
  activeFile.value.content = content;

  executeCode();
}

function onEditorMount() {
  if(!activeFile.value) {
    setTimeout(() => {
      loading.value = false;
    }, 1000);

    return;
  }

  editorRef.value.createModel(activeFile.value.id, activeFile.value.content);

  onFileSelect(activeFile.value.id);

  setTimeout(() => {
    loading.value = false;

    executeCode();
  }, 1000);
}

const loading = ref(true);
const editorRef = ref(null);
const iframeRef = ref(null);
const aiPanelOpen = ref(false);
const aiLoading = ref(false);
const files = ref([{ id: 1, name: "app.js", content: inputCode }]);
const activeFile = ref(files.value[0]);
let timeoutIds = [];
let intervalIds = [];
let controllers = [];

function onFileSelect(fileId) {
  activeFile.value = files.value.find((file) => file.id === fileId);

  editorRef.value.selectModel(activeFile.value.id);
}

function onFileAdd() {
  const file = { id: Date.now(), name: "untitled.js", content: "" };

  files.value.push(file);

  editorRef.value.createModel(file.id, file.content);

  onFileSelect(file.id);
}

function onFileRename({ id, newName }) {
  const file = files.value.find((file) => file.id === id);

  file.name = newName;
}

function onFileDelete(fileId) {
  files.value = files.value.filter((file) => file.id !== fileId);

  editorRef.value.deleteModel(fileId);

  if (files.value.length === 0) {
    activeFile.value = null;

    return;
  }

  onFileSelect(files.value[files.value.length - 1].id);
}

function onRunCode() {
  executeCode();
}

function onFormatCode() {
  editorRef.value.formatCode();
}

function onToggleAi() {
  aiPanelOpen.value = !aiPanelOpen.value;
}

async function onAiSubmit(message) {
  aiLoading.value = true;
  editorRef.value.setDisabled(true);

  if (!activeFile.value) {
      onFileAdd();
  }

  try {
    let currentSelection = null;

    try {
      const selectionInstance = editorRef.value.getSelection();
      const model = editorRef.value.getModel();
      const text = model.getValueInRange(selectionInstance);

      currentSelection = {
          start: selectionInstance.startLineNumber,
          end: selectionInstance.endLineNumber,
          text,
      }
    } catch (error) {}

    const code = await generateCode({ message, context: activeFile.value.content, selection: currentSelection });

    const changes = diffLines(activeFile.value.content, code);

    activeFile.value.content = code;
    
    await editorRef.value.animateEditsV2(changes);
    
    editorRef.value.updateContent(code);

    executeCode();
  } catch (error) {
    console.error(error);
  } finally {
    aiLoading.value = false;

    editorRef.value.setDisabled(false);
  }
}

onMounted(() => {
  document.addEventListener("keydown", (event) => {
    if (event.ctrlKey && event.key === "j") {
      event.preventDefault();

      onFileAdd();
    }

    if (event.ctrlKey && event.key === "k") {
      event.preventDefault();

      onToggleAi();
    }
  });
});
</script>

<template>
  <Loading :loading="loading" />

  <iframe ref="iframeRef" style="display: none;"></iframe>

  <div style="height: 100%">
    <Navbar :files="files" :activeFile="activeFile" :isDisabled="aiLoading" @onFileSelect="onFileSelect" @onFileAdd="onFileAdd" @onFileDelete="onFileDelete" @onRunCode="onRunCode" @onFormatCode="onFormatCode" @onToggleAi="onToggleAi" @onFileRename="onFileRename" />
    
    <div v-show="files.length > 0">
      <Editor @onMount="onEditorMount" @onChange="onChange" @onFileSave="executeCode" @onFileAdd="onFileAdd" @onToggleAi="onToggleAi" ref="editorRef" />
    </div>

    <transition name="fade-up">
      <AiPanel v-if="aiPanelOpen" @onSubmit="onAiSubmit" @onClose="aiPanelOpen = false" :loading="aiLoading" />
    </transition>

    <div v-if="files.length === 0" class="empty-state">
      <div class="empty-state-content" :style="{ opacity: aiPanelOpen ? '0.5' : '1' }">
        <div class="empty-state-title">Live JS 🚀</div>
        <div class="empty-state-subtitle">✨ Quickly prototype, experiment and test JavaScript code.</div>
        <div class="empty-state-hint" style="font-size: 1em;"><kbd>⌘</kbd> + <kbd>J</kbd> to create a new file</div>
        <div class="empty-state-hint" style="margin-top: 1.3em; font-size: 0.8em;"><kbd>⌘</kbd> + <kbd>K</kbd> to open the AI panel</div>
      </div>
    </div>
  </div>
</template>

<style>
body {
  margin: 0;
  padding: 0;
  height: 100vh;
  font-family: "Inter", sans-serif;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #1e1e1e;
  height: calc(100vh - 36px);
  color: #888;
  user-select: none;
}

.empty-state-content {
  text-align: center;
  padding: 2rem;
  border-radius: 8px;
  animation: fadeIn 0.5s ease-out;
  transition: opacity 0.3s ease-out;
}

.empty-state-title {
  font-size: 1.8rem;
  margin-bottom: 0.5rem;
  color: #888;
  font-weight: 600;
}

.empty-state-subtitle {
  margin-bottom: 1.2rem;
  color: #666;
  font-size: 1.1rem;
}

.empty-state-hint {
  font-size: 1.2rem;
  color: #666;
}

.empty-state-hint kbd {
  background-color: #333;
  border-radius: 4px;
  padding: 2px 6px;
  font-family: monospace;
  color: #e0e0e0;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
  100% {
    opacity: 1;
  }
}

.fade-up-enter-active,
.fade-up-leave-active {
  transition:
    opacity 0.1s cubic-bezier(0.19, 1, 0.22, 1),
    transform 0.5s cubic-bezier(0.19, 1, 0.22, 1);
}

.fade-up-enter-from,
.fade-up-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(80px) scale(0.95) !important;
}

.fade-up-enter-to,
.fade-up-leave-from {
  opacity: 1;
  transform: translateX(-50%) translateY(0) scale(1) !important;
}
</style>
