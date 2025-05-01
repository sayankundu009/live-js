<template>
    <div class="console-container">
        <header>
            <h6>Console</h6>
        </header>
        <div class="actions">
            <span role="button" class="clear-console-button" @click="clearConsole">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="rgba(255,255,255,1)" width="1em" height="1em">
                    <path d="M3.11 4.523a6 6 0 008.367 8.367L3.108 4.524zM4.522 3.11l8.368 8.367A6 6 0 004.524 3.11zM0 8a8 8 0 1116 0A8 8 0 010 8z"></path>
                </svg>
            </span>

            <span class="divider"></span>

            <div class="checkbox-container">
                <input type="checkbox" id="checkbox" v-model="preserveLogs" />
                <label for="checkbox">Preserve logs</label>
            </div>
        </div>
        <Console class="console-instance" ref="consoleCollectionInstance" :data="consoleInstance.value" :anchor="anchor" />
    </div>
</template>

<script setup>
import { ref } from "vue";
import { Console, DataAPI } from "vue-console-feed";
import "vue-console-feed/style.css"

function anchor(options) {
    return null;
}

const consoleInstance = new DataAPI(false);
const preserveLogs = ref(false);
const consoleCollectionInstance = ref(null);

function log(...args) {
    consoleInstance.log(...args);

    scrollToBottom();
}

function error(...args) {
    consoleInstance.error(...args);

    scrollToBottom();
}

function scrollToBottom() {
    requestAnimationFrame(() => {
        consoleCollectionInstance.value.$el.scrollTop = consoleCollectionInstance.value.$el.scrollHeight;
    });
}

function clearConsole() {
    consoleInstance.clear();
}

defineExpose({
    instance: consoleInstance,
    log,
    error,
    clearConsole,
    shouldPreserveLogs() {
        return preserveLogs.value;
    }
});
</script>

<style>
.console-container {
    z-index: 1000;
    width: 100%;
    height: 100%;
    background-color: #1e1e1e;
}

.console-container .console-wrap {
    background-color: #1e1e1e;
}

.console-container header {
    height: 25px;
    background-color: #1e1e1e;
    display: flex;
    align-items: center;
    border-top: 1px solid #3d3d3d;
    border-bottom: 1px solid #3d3d3d;
    padding: 4px;

    h6 {
        margin: 0;
        margin-left: 8px;
        font-size: .875rem;
        color: #fff;

        position: relative;
    }
}

.console-container .actions {
    display: flex;
    align-items: center;
    padding: 4px;

    .clear-console-button {
        cursor: pointer;
        margin-left: .25rem;
        transition: all 0.2s ease;
      
        svg {
            padding-top: 4px;
        }

        &:active {
            transform: scale(0.85);
        }
    }

    .divider {
        width: 2px;
        height: 1rem;
        background-color: #3d3d3d;
        margin-left: .55rem;
        margin-right: .55rem;
    }

    .checkbox-container {
        display: flex;
        align-items: center;
        gap: 6px;
        color: #888;
        font-size: 0.9rem;
        user-select: none;

        input[type="checkbox"] {
            appearance: none;
            width: 15px;
            height: 15px;
            border: 1px solid #404040;
            border-radius: 3px;
            background: #252525;
            cursor: pointer;
            position: relative;
            transition: all 0.2s ease;

            &:checked {
                background: #cd804f;
                border-color: #cd804f;

                &:after {
                    content: "";
                    position: absolute;
                    left: 4px;
                    top: -2px;
                    width: 4px;
                    height: 11px;
                    border: solid white;
                    border-width: 0 3px 2px 0;
                    transform: rotate(45deg);
                }
            }

            &:hover {
                border-color: #cd804f;
            }
        }
    }
}

.console-instance {
    height: calc(100% - 5rem);
    overflow-y: auto;
    overflow-x: hidden;

    scrollbar-width: thin;
    scrollbar-color: #404040 #252525;

    &::-webkit-scrollbar {
        width: 8px;
    }

    &::-webkit-scrollbar-track {
        background: #252525;
        border-radius: 4px;
    }

    &::-webkit-scrollbar-thumb {
        background: #404040;
        border-radius: 4px;

        &:hover {
            background: #505050;
        }
    }
}
</style>

