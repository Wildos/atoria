export default class AtoriaDataModel extends foundry.abstract.TypeDataModel {
    toPlainObject() {
        return { ...this };
    }
}