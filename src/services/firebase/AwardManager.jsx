import FirestoreAnalytics from "../../utils/FirestoreAnalytics";
import BadgeManagement from "./BadgeManagement";
import { createCustomAnalytics } from "../../utils/FirestoreAnalytics";
import UserManagement from "./UserManagementSystem";

export const awardBadges = async (userId) => {
    const user = await UserManagement.getUser(userId);

    const mappingData = { user: user };

    const badges = await BadgeManagement.getAllBadges();
    for (let badge of badges) {
        const rawstructure = badge.structure.replaceAll('\n', '').split(';');
        let structure = [];
        rawstructure.forEach(str => {
            const temp = str.split(',');
            if (temp.length == 2) {
                const first = temp[0].split(':');
                const second = temp[1].split(':');
                structure.push({ name: first[1], idField: second[1] });
            }
        });
        const rawmapping = badge.mapping.replaceAll('\n', '').split(';');

        let mapping = {};
        rawmapping.forEach(str => {
            const temp = str.split(':');
            if (temp.length == 2) {
                const fields = temp[1].split(',');
                mapping[temp[0]] = fields;
            }
        });

        const rawConditions = badge.conditions.split('\n');

        let conditions = [];
        rawConditions.forEach(str => {
            const temp = str.split(',');
            let cond = {};
            if (temp.length > 1) {
                temp.forEach(x => {
                    let t = x.split(':');
                    cond[t[0]] = t[1];
                });
                if (cond['value'].includes('{')) {
                    const tt = cond['value'].replaceAll('{', '').replaceAll('}', '').split('.');
                    let curData = mappingData;
                    for(let n of tt){
                        curData = curData[n];
                    }
                    cond['value'] = curData;
                }
                conditions.push(cond);

            }
        });


        const analytics = createCustomAnalytics(structure, mapping);
        const totalCalories = await analytics.query({
            targetDepth: 2,
            sumField: 'calories',
            conditions: conditions,
        });
        console.log(totalCalories);
    }
};