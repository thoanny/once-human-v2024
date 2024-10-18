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

    if (!specialisations.value) {
        return [];
    }

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
    ].sort((a, b) => a.localeCompare(b));
});

const getUsernameById = (id) => {
    return members.value?.find((member) => member.id === id)?.fields['Nom'] ?? id;
};

const getSpecialisationDescription = (text) => {
    return text.replace(/\n/g, '<br />');
};

const handleResetFilters = () => {
    selectedType.value = '';
    selectedMember.value = '';
    searchValue.value = '';
};
</script>

<template>
    <!-- <pre>{{ specialisations }}</pre> -->
    <main class="">
        <header
            class="sticky top-0 px-2 min-[1315px]:pl-16 min-[1315px]:pr-4 h-auto py-2 min-[1315px]:h-12 overflow-hidden border-b border-neutral bg-base-100 flex gap-4 min-[1315px]:items-center flex-col min-[1315px]:flex-row"
        >
            <div
                class="flex items-baseline gap-2 text-xl font-semibold min-w-[25rem] max-[1315px]:pl-14"
            >
                <h2 class="text-secondary">Mimétiques</h2>
                /
                <h3 class="text-primary">
                    Spécialisations
                    <small v-if="specialisations"
                        >({{ filteredSpecialisations.length }}/{{ specialisations.length }})</small
                    >
                </h3>
            </div>
            <div class="flex flex-1 gap-2 flex-col min-[840px]:flex-row">
                <input
                    type="text"
                    class="input input-bordered input-sm flex-1"
                    placeholder="Chercher..."
                    v-model="searchValue"
                />
                <div class="flex items-center">
                    <div class="badge badge-primary h-8">Type</div>
                    <select
                        class="select select-bordered select-sm select-primary max-[840px]:flex-1"
                        v-model="selectedType"
                    >
                        <option value="">---</option>
                        <option v-for="t in types" :key="t.id">{{ t }}</option>
                    </select>
                </div>
                <div class="flex items-center">
                    <div class="badge badge-secondary h-8">Membre</div>
                    <select
                        class="select select-bordered select-sm select-secondary max-[840px]:flex-1"
                        v-model="selectedMember"
                    >
                        <option value="">---</option>
                        <option value="any">N'importe</option>
                        <option v-for="member in members" :key="member.id" :value="member.id">
                            {{ member.fields['Nom'] }}
                        </option>
                    </select>
                </div>
                <button
                    class="btn btn-ghost min-[840px]:btn-square btn-sm"
                    @click="handleResetFilters"
                    v-show="searchValue || selectedType || selectedMember"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        class="size-5"
                    >
                        <path
                            d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z"
                        />
                    </svg>
                    <span class="hidden max-[840px]:inline">Réinitialiser les filtres</span>
                </button>
            </div>
        </header>

        <ul v-if="specialisations" class="flex gap-4 flex-col max-w-4xl mx-auto my-6">
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
                    <div
                        v-html="getSpecialisationDescription(specialisation.fields['Description'])"
                    ></div>
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
        <div
            v-if="specialisations && filteredSpecialisations.length === 0"
            class="flex gap-4 flex-col max-w-4xl mx-auto my-6"
        >
            <div class="text-center text-lg">Aucun résultat trouvé...</div>
        </div>
    </main>
</template>
