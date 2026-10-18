<script setup lang="ts">
import { ref } from 'vue'
import GreetingCard from './components/GreetingCard.vue'

const name = ref('playground')
</script>

<template>
  <main class="flex flex-col gap-4">
    <h1>Vue playground example</h1>
    <GreetingCard :name="name" />
  </main>
</template>
