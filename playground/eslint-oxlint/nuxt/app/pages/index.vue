<script setup lang="ts">
// `ref` is a Nuxt auto-import: the Vue Module declares it as a global so a template or script that
// uses it is not reported as an undefined variable.
const count = ref(0)
</script>

<template>
  <section>
    <h1>Nuxt playground example</h1>
    <CounterCard :count="count" @increment="count++" />
  </section>
</template>
