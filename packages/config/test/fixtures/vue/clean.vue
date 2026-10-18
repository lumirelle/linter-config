<script>
export default {
  name: 'GreetingCard',
  data() {
    return { message: 'hello' }
  },
  methods: {
    greet() {
      return this.message
    },
  },
}
</script>

<template>
  <div>{{ greet() }}</div>
</template>

<style scoped>
.greeting {
  color: red;
}
</style>
