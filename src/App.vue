<script setup>
import { RouterLink, RouterView } from 'vue-router';
</script>

<template>
    <header>
        <div class="wrapper">
            <div class="dropdown fixed z-10 top-0">
                <div tabindex="0" role="button" class="btn btn-neutral btn-square">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke-width="1.5"
                        stroke="currentColor"
                        class="size-6"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                        />
                    </svg>
                </div>
                <ul tabindex="0" class="dropdown-content menu bg-base-300 z-[1] w-52 p-2">
                    <li><RouterLink to="/">Home</RouterLink></li>
                    <li><RouterLink to="/about">About</RouterLink></li>
                </ul>
            </div>
        </div>
    </header>

    <RouterView />
</template>
