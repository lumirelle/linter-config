<script setup lang="ts">
defineProps<{ name: string }>()
</script>

<template>
  <section class="card">
    <!-- A labelled region: the accessibility rules this example enables check exactly this. -->
    <p :aria-label="`Greeting for ${name}`">
      Hello, {{ name }}!
    </p>
  </section>
</template>
