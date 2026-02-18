<template>
  <div class="my-6 w-full overflow-x-auto rounded-lg border">
    <table>
      <slot></slot>
    </table>
  </div>
</template>

<style scoped>
  table {
    width: 100%;
    text-align: left;
    font-size: 0.875rem;
    line-height: 1.25rem;
    border-collapse: separate;
    border-spacing: 0;
  }
</style>
