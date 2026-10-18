<template>
  <div :v-bind="value">{{ value }}</div>
</template>

<script setup>
const value = 1

if (value == 1) {
  debugger
}
</script>
