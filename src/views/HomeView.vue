<script setup>
import { onMounted, ref, computed, watch, reactive } from 'vue';

const specialisations = ref();
const members = ref();
const selectedType = ref('');
const selectedMember = ref('');
const searchValue = ref('');
const favorites = reactive([]);
const onlyFavorites = ref(false);
const isSharedUrl = ref(false);

const getSpecialisations = async () => {
    return await fetch('https://api.thoanny.fr/once-human/specialisations')
        .then((res) => res.json())
        .then((data) => data.specialisations.map((spec) => ({ ...spec, favorite: 0 })));
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
    initFavorites();
});

const filteredSpecialisations = computed(() => {
    const s = searchValue.value
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase();

    // console.log('s', s);

    if (!specialisations.value) {
        return [];
    }

    return specialisations.value
        .filter((specialisation) =>
            onlyFavorites.value && specialisation.favorite == 0 ? false : true,
        )
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
        .sort((a, b) => a.fields['Nom'].localeCompare(b.fields['Nom']))
        .sort((a, b) => b.favorite - a.favorite);
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

const initFavorites = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlSpecialisations = urlParams.get('specialisations');
    if (urlSpecialisations) {
        const _specialisations = urlSpecialisations.split(',').slice(0, 6);
        let total = 0;

        _specialisations.forEach((spec) => {
            const idx = specialisations.value.findIndex((s) => s.id === spec);
            if (idx >= 0) {
                specialisations.value[idx].favorite = 1;
                total++;
            }
        });

        if (total > 0) {
            onlyFavorites.value = true;
            isSharedUrl.value = true;
            return;
        }
    }

    const localFavorites = JSON.parse(localStorage.getItem('once-human-mimetics-favorites'));
    if (localFavorites) {
        Object.assign(favorites, localFavorites);
        localFavorites.forEach((fav) => {
            const idx = specialisations.value.findIndex((spec) => spec.id === fav);
            if (idx >= 0) {
                specialisations.value[idx].favorite = 1;
            }
        });
    }
};

const handleResetFilters = () => {
    selectedType.value = '';
    selectedMember.value = '';
    searchValue.value = '';
};

const handleFavorite = (id) => {
    const idx = favorites.indexOf(id);
    if (idx >= 0) {
        favorites.splice(idx, 1);
    } else {
        if (favorites.length >= 10) {
            return alert("Impossible d'ajouter plus de 10 spécialisations en favoris...");
        }
        favorites.push(id);
    }

    specialisations.value.find((spec) => spec.id === id).favorite = idx >= 0 ? 0 : 1;
};

watch(favorites, async () => {
    localStorage.setItem('once-human-mimetics-favorites', JSON.stringify(favorites));
});

const getSharedUrl = computed(() => {
    if (favorites.length > 0) {
        return location.origin + location.pathname + '?specialisations=' + favorites.join(',');
    }
    return;
});
</script>

<template>
    <!-- <pre class="my-12 mx-8">{{ getSharedUrl }}</pre> -->
    <main class="">
        <header
            class="sticky top-0 px-2 min-[1315px]:pl-16 min-[1315px]:pr-4 h-auto py-2 min-[1315px]:h-12 overflow-hidden border-b border-neutral bg-base-100 flex gap-4 min-[1315px]:items-center flex-col min-[1315px]:flex-row z-20"
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
                <button @click="onlyFavorites = !onlyFavorites" class="">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke-width="1.5"
                        stroke="currentColor"
                        class="size-5"
                        v-if="!onlyFavorites"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
                        />
                    </svg>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        class="size-5 text-primary"
                        v-else
                    >
                        <path
                            fill-rule="evenodd"
                            d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z"
                            clip-rule="evenodd"
                        />
                    </svg>
                </button>
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

        <ul v-if="specialisations" class="flex gap-4 flex-col max-w-4xl mx-auto my-6 px-2">
            <li v-if="isSharedUrl" class="font-semibold">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    class="size-5 inline-block text-secondary"
                >
                    <path
                        fill-rule="evenodd"
                        d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z"
                        clip-rule="evenodd"
                    />
                </svg>

                Vous visualisez une selection de spécialisations partagée, pour revenir à la version
                originale,
                <a href="/" class="underline text-primary">cliquez ici</a>.
            </li>
            <li class="flex gap-2 items-center" v-else-if="getSharedUrl">
                <span class="font-semibold">Partagez vos spécialisations :</span>
                <input
                    type="text"
                    :value="getSharedUrl"
                    class="input input-sm input-bordered flex-1"
                    @click="$event.target.select()"
                />
            </li>
            <li
                v-for="specialisation in filteredSpecialisations"
                :key="specialisation.id"
                :data-id="specialisation.id"
                class="flex gap-3 items-center bg-neutral bg-opacity-25 px-4 py-3 relative"
            >
                <button
                    class="absolute top-4 right-3 group"
                    @click="handleFavorite(specialisation.id)"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke-width="1.5"
                        stroke="currentColor"
                        class="size-5 group-hover:text-secondary"
                        v-if="!specialisation.favorite"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
                        />
                    </svg>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        class="size-5 text-primary hover:text-secondary"
                        v-else
                    >
                        <path
                            fill-rule="evenodd"
                            d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z"
                            clip-rule="evenodd"
                        />
                    </svg>
                </button>

                <img
                    :src="`/specialisations/${specialisation.id}.png`"
                    class="self-start w-18 h-18"
                    onerror="this.src='/specialisations/default.png'"
                />
                <div class="flex flex-col flex-1 gap-1">
                    <div class="font-bold text-white text-lg flex gap-2 items-center mr-6">
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
