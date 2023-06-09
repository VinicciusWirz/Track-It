import axios from "axios";
import { useContext, useState } from "react";
import { TailSpin } from "react-loader-spinner";
import checkMark from "../../../assets/check.svg";
import { url } from "../../../constants/url";
import UserInfoContext from "../../../contexts/UserInfoContext";
import { CheckBox, HabitContent, LoadingFromServer, SequenceStyle } from "../styled";

export default function HabitCard({ cardInfo, renderProgress }) {
    const { currentSequence, done, highestSequence, id, name } = cardInfo;
    const { userInfo, setUserInfo } = useContext(UserInfoContext);
    const [cardContent, setCardContent] = useState({ done, currentSequence, highestSequence });
    const [waitingAnswer, setWaitingAnswer] = useState(false);
    const config = {
        headers: {
            "Authorization": `Bearer ${userInfo.token}`
        }
    };
    const percentage = 100;
    function handleToggleCheckbox() {
        const urlPost = `${url}/habits/${id}/${cardContent.done ? 'uncheck' : 'check'}`;
        const sequenceUpdate = cardContent.done ? (cardContent.currentSequence - 1) : (cardContent.currentSequence + 1);
        let updatedCard = {};
        if (!waitingAnswer) {
            updatedCard = { ...cardContent, done: !cardContent.done, currentSequence: sequenceUpdate };
            const progressId = renderProgress.find(e => e.id === id);
            progressId.done = !cardContent.done;
            setWaitingAnswer(true);
            setCardContent(updatedCard);
            axios.post(urlPost, {}, config)
                .then(() => {
                    refreshCardRecord(updatedCard);
                })
                .catch((err) => {
                    alert(err.response ? err.response.data.message : err.message);
                    setWaitingAnswer(false);
                    setCardContent(cardContent);
                    progressId.done = cardContent.done;
                    const progress = (renderProgress.filter((e) => e.done).length * percentage) / renderProgress.length;
                    setUserInfo({ ...userInfo, progress });
                });
            const progress = (renderProgress.filter((e) => e.done).length * percentage) / renderProgress.length;
            setUserInfo({ ...userInfo, progress });
        }
    }

    function refreshCardRecord(updatedCard) {
        axios.get(`${url}/habits/today`, config)
            .then(res => {
                const objUpdated = res.data.find(h => h.id === id);
                setCardContent({ ...updatedCard, highestSequence: objUpdated.highestSequence });
                setWaitingAnswer(false);
            })
            .catch(err => {
                alert(err.response.data.message);
                setWaitingAnswer(false);
            });
    }

    return (
        <HabitContent data-test="today-habit-container">
            <article>
                <h3 data-test="today-habit-name">
                    {name}
                </h3>
                <p data-test="today-habit-sequence">
                    Sequência atual: <SequenceStyle done={cardContent.done ? '#8FC549' : '#666666'}>
                        {cardContent.currentSequence} {cardContent.currentSequence > 1 ? 'dias' : 'dia'}
                    </SequenceStyle>
                </p>
                <p data-test="today-habit-record">
                    Seu recorde: <SequenceStyle done={(cardContent.currentSequence === cardContent.highestSequence && cardContent.highestSequence !== 0) ? '#8FC549' : '#666666'}>
                        {cardContent.highestSequence} {cardContent.highestSequence > 1 ? 'dias' : 'dia'}
                    </SequenceStyle>
                </p>
            </article>

            <CheckBox done={cardContent.done ? '#8FC549' : '#EBEBEB'} onClick={handleToggleCheckbox} data-test="today-habit-check-btn">
                {(waitingAnswer) ?
                    <LoadingFromServer>
                        <TailSpin width="50" height='50' color={cardContent.done ? '#EBEBEB' : '#FFFFFF'} />
                    </LoadingFromServer>
                    :
                    <img src={checkMark} />
                }
            </CheckBox>
        </HabitContent>
    );
}