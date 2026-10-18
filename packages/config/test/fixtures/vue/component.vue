<script lang="ts">
interface Props {
  label: string
}

export default {
  props: {
    label: { type: String, required: true },
  },
  computed: {
    labelText(): string {
      return (this as unknown as Props).label
    },
  },
}
</script>

<template>
  <span>{{ labelText }}</span>
</template>
