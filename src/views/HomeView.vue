<script setup>
import { onMounted, ref, computed } from 'vue';

const specialisations = ref();
const members = ref();
const selectedType = ref('');
const selectedMember = ref('');
const searchValue = ref('');

const getSpecialisations = async () => {
    return await fetch('https://api.thoanny.fr/once-human/specialisations')
        .then((res) => res.json())
        .then((data) => data.specialisations);
};

const getMembers = async () => {
    return await fetch('https://api.thoanny.fr/once-human/ruche')
        .then((res) => res.json())
        .then((data) =>
            data.members
                .filter((member) => typeof member.fields['Nom'] !== 'undefined')
                .sort((a, b) => a.fields['Nom'].localeCompare(b.fields['Nom'])),
        );
};

onMounted(async () => {
    specialisations.value = await getSpecialisations();
    members.value = await getMembers();
});

const filteredSpecialisations = computed(() => {
    const s = searchValue.value
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase();

    console.log('s', s);

    return specialisations.value
        .filter((specialisation) => typeof specialisation.fields['Nom'] !== 'undefined')
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
        .filter((specialisation) =>
            selectedMember.value
                ? selectedMember.value === 'any'
                    ? specialisation.fields['Ruche']?.length > 0
                    : specialisation.fields['Ruche']?.indexOf(selectedMember.value) >= 0
                : true,
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

const getUsernameById = (id) => {
    return members.value?.find((member) => member.id === id)?.fields['Nom'] ?? id;
};
</script>

<template>
    <!-- <pre>{{ specialisations }}</pre> -->
    <main class="max-w-4xl mx-auto my-6">
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
                    <option v-for="t in types" :key="t.id">{{ t }}</option>
                </select>
            </div>
            <div class="flex items-center">
                <div class="badge badge-secondary h-full">Membre</div>
                <select
                    class="select select-bordered select-sm select-secondary"
                    v-model="selectedMember"
                >
                    <option value="">---</option>
                    <option value="any">N'importe</option>
                    <option v-for="member in members" :key="member.id" :value="member.id">
                        {{ member.fields['Nom'] }}
                    </option>
                </select>
            </div>
        </div>

        <ul v-if="specialisations" class="flex gap-4 flex-col">
            <li
                v-for="specialisation in filteredSpecialisations"
                :key="specialisation.id"
                :data-id="specialisation.id"
                class="flex gap-3 items-center bg-neutral bg-opacity-25 px-4 py-3"
            >
                <img
                    :src="`/specialisations/${specialisation.id}.png`"
                    class="self-start w-18 h-18"
                    onerror="this.src='/specialisations/default.png'"
                />
                <div class="flex flex-col flex-1 gap-1">
                    <div class="font-bold text-white text-lg flex gap-2 items-center">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            class="size-6 text-success"
                            v-if="specialisation.fields['Validé']"
                        >
                            <path
                                fill-rule="evenodd"
                                d="M16.403 12.652a3 3 0 0 0 0-5.304 3 3 0 0 0-3.75-3.751 3 3 0 0 0-5.305 0 3 3 0 0 0-3.751 3.75 3 3 0 0 0 0 5.305 3 3 0 0 0 3.75 3.751 3 3 0 0 0 5.305 0 3 3 0 0 0 3.751-3.75Zm-2.546-4.46a.75.75 0 0 0-1.214-.883l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
                                clip-rule="evenodd"
                            />
                        </svg>

                        {{ specialisation.fields['Nom'] }}
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
                            v-for="userId in specialisation.fields['Ruche']"
                        >
                            {{ getUsernameById(userId) }}
                        </span>
                    </div>
                </div>
            </li>
        </ul>
    </main>
</template>
