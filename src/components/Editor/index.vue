<template>
  <section class="editor-container" :class="{ 'disabled': isDisabled }">
    <vue-monaco-editor :options="MONACO_EDITOR_OPTIONS" @mount="handleMount" language="javascript" width="100%" height="calc(100vh - 36px)">
      <template #default></template>
    </vue-monaco-editor>
  </section>
  
  <Teleport to="head">
    <component :is="'style'">
      {{
        textDecorationCollection.reduce((acc, item, index) => {
          return (
            acc +
            `
            .text-decoration-${index} {
              position: relative;
              z-index: -1;
              padding: 2px 0;
              pointer-events: none;
              color: ${item.type === 'error' ? '#cd4f4f' : '#4f88cd'};
              font-family: "Droid Sans Mono", "monospace", monospace;
              font-size: ${MONACO_EDITOR_OPTIONS.fontSize}px;
              font-weight: bold;
              width: max-content;
              animation: fadeIn 0.1s;
            }
            .text-decoration-${index}::after {
              content: '${item.text}';
              color: ${item.type === 'error' ? '#cd4f4f' : '#4f88cd'};
              font-family: "Droid Sans Mono", "monospace", monospace;
              font-size: ${MONACO_EDITOR_OPTIONS.fontSize}px;
              font-weight: bold;
              position: absolute;
              left: 19px;
              width: 1rem;
              word-break: break-all;
            }
        `
          );
        }, "")
      }}

      {{`
        .edit-cursor {
          width: 2px !important;
          background-color: #90EE90CC;
          margin-left: 10px;
        }
        .edit-cursor::after {
          content: 'AI';
          position: absolute;
          bottom: -100%;
          left: 0px;
          width: max-content;
          padding: 0px 2px;
          pointer-events: none;
          color: #000000cc;
          font-family: "Droid Sans Mono", "monospace", monospace;
          font-size: ${MONACO_EDITOR_OPTIONS.fontSize - 3}px;
          font-weight: bold;
          background-color: #90ee90;
        }`
      }}
    </component>
  </Teleport>
</template>

<script setup>
import { ref, shallowRef } from "vue";
import { createHighlighterCore } from 'shiki/core'
import { shikiToMonaco  } from "@shikijs/monaco";
import { DARK_PLUS } from "../../utils/monaco/themes";
import javascriptLang from '@shikijs/langs/javascript';
import { createOnigurumaEngine } from 'shiki/engine/oniguruma'
import shikiWasm from 'shiki/wasm';

const props = defineProps({});

const emit = defineEmits(["onMount", "onChange", "onFileAdd", "onFileSave", "onToggleAi"]);

const isDisabled = ref(false);

const textDecorationCollection = ref([]);
const textDecorations = ref([]);

const editDecorationCollection = ref([]);
const editDecorations = ref([]);

const MONACO_EDITOR_OPTIONS = ref({
  formatOnType: false,
  formatOnPaste: false,
  fontSize: 18,
  wordWrap: true,
});

const editorRef = shallowRef();
const monacoRef = shallowRef();

const models = new Map();

defineExpose({ 
  addTextAboveLine, 
  clearDecorations, 
  createModel, 
  updateModelContent,
  updateContent,
  applyEdits,
  animateEdits,
  animateEditsV2,
  deleteModel, 
  selectModel,
  getSelection: () => editorRef.value?.getSelection(),
  getModel: () => editorRef.value?.getModel(),
  monaco: () => monacoRef.value,
  executeEdits: (...args) => editorRef.value?.executeEdits(...args),
  formatCode,
  setDisabled: (value) => isDisabled.value = value,
});

async function handleMount(editor, monaco) {
  editorRef.value = editor;
  monacoRef.value = monaco;

  try {
    await setupTheme();
  } catch (error) {
    console.error("Failed to setup theme:", error);
  }

  setupKeybindings();

  emit("onMount");
}

async function setupTheme() {
  const highlighter = await createHighlighterCore({
    themes: [DARK_PLUS],
    langs: [javascriptLang],
    engine: createOnigurumaEngine(shikiWasm)
  });

  shikiToMonaco(highlighter, monacoRef.value);

  monacoRef.value.languages.register({ id: "javascript" });

  monacoRef.value.editor.setTheme("dark-plus");
}

function setupKeybindings() {
  editorRef.value.addCommand(monacoRef.value.KeyMod.CtrlCmd | monacoRef.value.KeyCode.KeyS, () => {
    emit("onFileSave");
  });

  editorRef.value.addCommand(monacoRef.value.KeyMod.CtrlCmd | monacoRef.value.KeyCode.KeyJ, () => {
    emit("onFileAdd");
  });

  editorRef.value.addCommand(monacoRef.value.KeyMod.CtrlCmd | monacoRef.value.KeyCode.KeyK, () => {
    emit("onToggleAi");
  });
}

function formatCode() {
  editorRef.value?.getAction('editor.action.formatDocument').run()
}

function addTextAboveLine({ line, text, type = 'log' }) {
  requestIdleCallback(() => {
    try {
      const decorationIndex = textDecorationCollection.value.findIndex((decoration) => decoration.lineNumber == line);

      if (decorationIndex != -1) {
        const decoration = textDecorationCollection.value[decorationIndex];
        const updatedText = [decoration.text, text].join(", ");
        decoration.text = updatedText;
        decoration.type = type;

        textDecorationCollection.value = [...textDecorationCollection.value];
        return;
      }

      if (!editorRef.value?.getModel()) {
        console.warn("Editor not active");

        return;
      }

      const lineContent = editorRef.value.getModel().getLineContent(line);

      const decoration = {
        range: new monacoRef.value.Range(line, lineContent.length, line, lineContent.length + 1),
        options: {
          isWholeLine: true,
          shouldFillLineOnLineBreak: false,
          blockIsAfterEnd: true,
          after: {
            content: " ",
            inlineClassName: `text-decoration-${textDecorationCollection.value.length}`,
          },
        },
      };

      const result = editorRef.value.deltaDecorations([], [decoration]);

      if (result?.length) {
        textDecorations.value = [...textDecorations.value, ...result];
        
        textDecorationCollection.value.push({
          text,
          lineNumber: line,
          type,
        });
      }
    } catch {
      console.warn("Editor not active");
      return;
    }
  });
}

function clearDecorations() {
  editorRef.value.getModel().deltaDecorations(textDecorations.value, []);

  textDecorationCollection.value = [];
}

function addEditDecoration(range) {
  const decoration = {
    range,
    options: {
      className: `edit-cursor`,
      isWholeLine: false,
    }
  }

  editDecorations.value = editorRef.value.deltaDecorations([], [decoration]);
  editDecorationCollection.value = [...editDecorationCollection.value];
}

function clearEditDecorations() {
  editorRef.value.getModel().deltaDecorations(editDecorations.value, []);

  editDecorationCollection.value = [];
}

function createModel(fileId, content, language = 'javascript') {
  if (!monacoRef.value || !editorRef.value) {
    console.warn('Editor not initialized');

    return;
  }

  if (models.has(fileId)) {
    selectModel(fileId);

    return;
  }

  const model = monacoRef.value.editor.createModel(
    content,
    language,
    monacoRef.value.Uri.parse(`file:///${fileId}`)
  );

  model.onDidChangeContent((event) => {
    if (event.isFlush) {
      return;
    }

    emit("onChange", {
      fileId,
      content: model.getValue(),
    });
  });

  models.set(fileId, model);
}

function updateModelContent(fileId, content) {
  if (!models.has(fileId)) {
    console.warn(`Model for ${fileId} does not exist`);

    return;
  }
  
  const model = models.get(fileId);

  model.setValue(content);
}

function updateContent(code){
  const lineCount = editorRef.value.getModel().getLineCount() + 1;

  let op = {
    identifier: 'my-source',
    range: new monacoRef.value.Range(1, 1, lineCount, 1),
    text: code,
    forceMoveMarkers: true
  };

  editorRef.value.executeEdits("my-source", [op]);
}

async function animateEdits(changes) {  
  clearEditDecorations();

  let counter = 0;
  let collection = [];

  const maxLine = editorRef.value.getModel().getLineCount();

  const decorations = changes.flatMap(change => {
    if(change.op === 'remove') {
      return [];
    }

    const lines = [];
    const valueLines = change.text.split('\n');
    const numLines = valueLines.length - (valueLines[valueLines.length - 1] === '' ? 1 : 0);

    const endLine = Math.min(change.range.startLineNumber + numLines, maxLine);

    for (let index = change.range.startLineNumber; index <= endLine; index++) {
      lines.push({
        range: new monacoRef.value.Range(index, 1, index, 1),
        options: {
          className: `edit-highlight-${counter}`,
          isWholeLine: false,
        }
      });

      collection.push({
        type: change.op,
      });

      counter++;
    }

    return lines;
  });

  editDecorations.value = editorRef.value.deltaDecorations([], decorations);
  editDecorationCollection.value = collection;

  return new Promise(resolve => setTimeout(() => {
    clearEditDecorations();

    resolve();
  }, collection.length * 0.05 * 1000));
}

async function animateEditsV2(changes) {
  async function startAnimation(text, range, op){
    const delay = 10;

    async function insertOperation() {
      const textArray = [...text.split(''), range.startLineNumber !== 1 ? '\n' : ''];

      let index = 0;
      let startColumn = range.startColumn;
      let startLineNumber = range.startLineNumber;

      for (const char of textArray) {
          const column = startColumn + index;

          const operationRange = new monacoRef.value.Range(
              startLineNumber,
              column,
              startLineNumber,
              column
          );

          let op = {
              identifier: 'my-source',
              range: operationRange,
              text: char,
              forceMoveMarkers: false
          };

          editorRef.value.executeEdits("my-source", [op]);

          addEditDecoration(operationRange)

          index++;
          
          await new Promise(resolve => setTimeout(resolve, delay));

          clearEditDecorations();
      }
    }

    async function removeOperation(range) {
      const lineNumber = Math.max(range.startLineNumber - 1, 0);
      const previousLineContent = lineNumber === 0 ? '' : editorRef.value?.getModel().getLineContent(lineNumber);
      const startColumn = range.startLineNumber === 1 ? 1 : previousLineContent.length + 1;

      let op = {
        identifier: 'my-source',
        range: new monacoRef.value.Range(lineNumber, startColumn, range.endLineNumber, range.endColumn),
        text: null,
        forceMoveMarkers: false
      };

      editorRef.value.executeEdits("my-source", [op]);

      await new Promise(resolve => setTimeout(resolve, delay));
    }

    return op === 'remove' ? removeOperation(range) : insertOperation();
  }

  let previousChange = null;
  let removeOperationCount = 0;

  for (const change of changes) {
    const { op, range, text } = change;

    if(previousChange && previousChange.op == 'remove' && op == 'remove' && previousChange.range.startLineNumber != 1){
      removeOperationCount++
      range.startLineNumber = range.startLineNumber - removeOperationCount;
      range.endLineNumber = range.startLineNumber;
    } else {
      removeOperationCount = 0;
    }

    await startAnimation(text, range, op);

    previousChange = change;
  }

  return Promise.resolve();
}

function applyEdits(fileId, changes, { animate = false } = {}) {
  if (!models.has(fileId)) {
    console.warn(`Model for ${fileId} does not exist`);

    return;
  }
  
  const model = models.get(fileId);

  model.applyEdits(changes);

  if (animate) {
    animateEdits(changes);
  }
}

function deleteModel(fileId) {
  if (!models.has(fileId)) {
    return;
  }

  const model = models.get(fileId);
  model.dispose();
  models.delete(fileId);
}

function selectModel(fileId) {
  if (!editorRef.value) {
    console.warn('Editor not initialized');

    return;
  }

  if (!models.has(fileId)) {
    console.warn(`Model for ${fileId} does not exist`);

    return;
  }

  editorRef.value.setModel(models.get(fileId));
}
</script>

<style>
@keyframes fadeIn {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
</style>
