<script setup lang="ts">
defineProps<{ count: number }>()
const emit = defineEmits<{ increment: [] }>()
</script>

<template>
  <button type="button" class="counter" @click="emit('increment')">Count: {{ count }}</button>
</template>
