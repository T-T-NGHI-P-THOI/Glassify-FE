export default class EnvVaribles {
    static BASIC_URL = import.meta.env.API_URL ? import.meta.env.API_URL : 'http://localhost:5000';

}