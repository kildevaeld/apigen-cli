
import {Repository} from '../repository';
import {GolangGenerator} from './golang'


export function addGenerators(repo: Repository) {

    repo.addModule("golang", GolangGenerator);

}