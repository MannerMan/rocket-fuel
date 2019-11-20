import ApiFetch from '../components/utils/apifetch';

export function searchTag(searchString) {
    const options = {
        url: `/api/tags?search=${searchString}`
    };

    return ApiFetch(options);
}
