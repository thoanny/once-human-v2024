<script setup>
import { onMounted, ref, computed } from 'vue';

const specialisations = ref();
const selectedType = ref('');
const searchValue = ref('');

const getSpecialisations = async () => {
    return await fetch('https://api.thoanny.fr/once-human/specialisations')
        .then((res) => res.json())
        .then((data) => data.specialisations);
};

onMounted(async () => {
    specialisations.value = await getSpecialisations();
});

const filteredSpecialisations = computed(() => {
    const s = searchValue.value
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase();

    console.log('s', s);

    return specialisations.value
        .filter((specialisation) =>
            s
                ? specialisation.fields['Nom']
                      .normalize('NFD')
                      .replace(/\p{Diacritic}/gu, '')
                      .toLowerCase()
                      .indexOf(s) >= 0 ||
                  specialisation.fields['Description']
                      .normalize('NFD')
                      .replace(/\p{Diacritic}/gu, '')
                      .toLowerCase()
                      .indexOf(s) >= 0
                : true,
        )
        .filter((specialisation) =>
            selectedType.value ? specialisation.fields['Type'] === selectedType.value : true,
        )
        .sort((a, b) => a.fields['Nom'].localeCompare(b.fields['Nom']));
});

const types = computed(() => {
    return [
        ...new Set(
            specialisations.value
                ?.map((spec) => {
                    return spec.fields['Type'];
                })
                .filter((spec) => spec),
        ),
    ];
});
</script>

<template>
    <main class="max-w-3xl mx-auto my-6">
        <h2 class="text-4xl font-semibold text-secondary mb-4">Mimétiques</h2>
        <h3 class="text-3xl font-semibold text-primary mb-4">
            Spécialisations
            <small v-if="specialisations"
                >({{ filteredSpecialisations.length }}/{{ specialisations.length }})</small
            >
        </h3>

        <div class="flex gap-2 my-4">
            <input
                type="text"
                class="input input-bordered input-sm flex-1"
                placeholder="Chercher..."
                v-model="searchValue"
            />
            <div class="flex items-center">
                <div class="badge badge-primary h-full">Type</div>
                <select
                    class="select select-bordered select-sm select-primary"
                    v-model="selectedType"
                >
                    <option value="">---</option>
                    <option v-for="type in types">{{ type }}</option>
                </select>
            </div>
            <div class="flex items-center">
                <div class="badge badge-secondary h-full">Membre</div>
                <select class="select select-bordered select-sm select-secondary">
                    <option value="">---</option>
                </select>
            </div>
        </div>

        <ul v-if="specialisations" class="flex gap-4 flex-col">
            <li
                v-for="specialisation in filteredSpecialisations"
                :key="specialisation.id"
                class="flex gap-3 items-center bg-neutral bg-opacity-25 px-4 py-3"
            >
                <img
                    :src="`/specialisations/${specialisation.id}.png`"
                    class="self-start w-18 h-18"
                    onerror="this.src='/specialisations/default.png'"
                />
                <div class="flex flex-col flex-1 gap-1">
                    <div class="font-bold text-white text-lg">
                        {{ specialisation.fields['Nom'] }} ({{ specialisation.id }})
                    </div>
                    <div>
                        {{ specialisation.fields['Description'] }}
                    </div>
                    <div class="flex flex-wrap gap-2 my-1">
                        <span class="badge badge-primary" v-if="specialisation.fields['Type']">
                            {{ specialisation.fields['Type'] }}
                        </span>
                        <span
                            class="badge badge-secondary"
                            v-for="user in specialisation.fields['Ruche']"
                        >
                            {{ user }}
                        </span>
                    </div>
                </div>
            </li>
        </ul>
    </main>
</template>
