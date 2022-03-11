import React, { useRef, useState } from "react";
import PropTypes from "prop-types";
import AdapterDateFns from "@mui/lab/AdapterDateFns";
import LocalizationProvider from "@mui/lab/LocalizationProvider";
import TimePicker from "@mui/lab/TimePicker";
import {
  Box,
  Card,
  CardContent,
  IconButton,
  TextField,
  Typography,
  LinearProgress,
  Alert,
  Collapse,
} from "@mui/material";

import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import EditIcon from "@mui/icons-material/Edit";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import dayjs from "dayjs";
import Countdown, {
  CountdownRenderProps,
  CountdownApi,
  zeroPad,
} from "react-countdown";

import { useDispatch } from "react-redux";
import { updateTimer, updateTitle } from "../store/timer";

type Props = {
  id: string;
  title: string;
  onDelete?: () => void;
};
type Progress = {
  value: number;
  startDate: number;
  endDate: number;
};

const TimerCard = (props: Props) => {
  const [time, setTime] = useState(dayjs().add(1, "h").toDate());
  const [title, setTitle] = useState(props.title);
  const tmpTitle = useRef("");
  const [isTitleEditMode, setTitleEditMode] = useState(false);
  const [canStartTimer, setCanStartTimer] = useState(true);
  const [countdownDate, setCountdownDate] = useState(Date.now());
  const [isRunning, setRunning] = useState(false);
  const [progress, setProgress] = useState<Progress>({
    value: 0,
    startDate: Date.now(),
    endDate: Date.now(),
  });

  const dispatch = useDispatch();

  let countdownApi: CountdownApi | undefined = undefined;
  // Renderer callback with condition
  const countdownRender = ({
    hours,
    minutes,
    seconds,
    completed,
  }: CountdownRenderProps) => {
    return (
      <Typography component="div" variant="h5" textAlign={"right"}>
        {zeroPad(hours)}:{zeroPad(minutes)}:{zeroPad(seconds)}
      </Typography>
    );
  };

  const startTimer = () => {
    const timeDate = dayjs()
      .set("hour", time.getHours())
      .set("minute", time.getMinutes())
      .set("second", time.getSeconds());
    setCountdownDate(timeDate.valueOf());
    setProgress({
      value: 0,
      startDate: Date.now(),
      endDate: time.valueOf(),
    });
    countdownApi?.start();
    setRunning(true);
  };
  const pauseTimer = () => {
    console.log("pause timer");
    setRunning(false);
    countdownApi?.pause();
    // setCountdownDate(Date.now());
  };
  const completeTimer = () => {
    console.log("on complete timer");
    timerAlert();
    setRunning(false);
    countdownApi?.stop();
    // TODO:タイマー終了時に残り時間を00:00:00にしたいが、カウントダウンの日時を設定すると再度アラートが発火する
    // setCountdownDate(Date.now());
  };
  const onCountdownTick = () => {
    setProgress((state) => ({
      ...state,
      value:
        ((Date.now() - state.startDate) * 100) /
        (state.endDate - state.startDate),
    }));
  };
  /**
   * Notification APIで通知する
   */
  const timerAlert = () => {
    const n = new Notification(`${title} alert!`, {
      tag: title + Date.now().toString(),
    });
    n.onclick = () => {
      n.close();
    };
  };
  const onChangeTitleEditMode = () => {
    console.log("onChangeTitleEditMode");
    if (isTitleEditMode) {
      setTitleEditMode((flg) => !flg);
      setTitle(tmpTitle.current);
      dispatch(updateTitle({ id: props.id, title: tmpTitle.current }));
    } else {
      setTitleEditMode((flg) => !flg);
      tmpTitle.current = title;
    }
    console.log({
      title,
      tmp: tmpTitle.current,
    });
  };
  const onChangeStartPauseButton = () => {
    console.log("onChangeStartPauseButton");
    if (isRunning) {
      pauseTimer();
    } else {
      // タイマー有効化
      startTimer();
    }
  };

  return (
    <div className="TimerCard">
      <Card
        sx={{
          width: "500px",
        }}
      >
        <CardContent>
          <Box
            sx={{
              alignItems: "flex-start",
              display: "flex",
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                }}
              >
                <TextField
                  id="title "
                  label="title"
                  defaultValue={title}
                  inputRef={tmpTitle}
                  onChange={(v) => {
                    tmpTitle.current = v.target.value;
                  }}
                  sx={{
                    width: "200px",
                  }}
                  style={!isTitleEditMode ? { display: "none" } : {}}
                />
                <Typography
                  component="div"
                  variant="h5"
                  textAlign={"left"}
                  sx={{
                    pl: 1,
                    pt: 2,
                    pb: 1,
                    width: "200px",
                    boxSizing: "border-box",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                  style={isTitleEditMode ? { display: "none" } : {}}
                >
                  {title}
                </Typography>
                <IconButton
                  aria-label="edit-title"
                  onClick={onChangeTitleEditMode}
                  sx={{
                    mt: 1,
                    mb: 1,
                  }}
                  disabled={isRunning}
                >
                  {isTitleEditMode ? <CheckCircleIcon /> : <EditIcon />}
                </IconButton>
              </Box>
              {/* タイマーコントロール */}
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <IconButton
                  aria-label="play/pause"
                  onClick={onChangeStartPauseButton}
                  disabled={isTitleEditMode || !canStartTimer}
                >
                  {isRunning ? <PauseIcon /> : <PlayArrowIcon />}
                </IconButton>
                <IconButton aria-label="reset" onClick={props.onDelete}>
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Box>
            {/* 右側の要素 */}
            <Box
              sx={{
                display: "flex",
                alignItems: "baseline",
                flexDirection: "column",
              }}
            >
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <TimePicker
                  ampm={false}
                  value={time}
                  onChange={(newValue) => {
                    if (newValue) {
                      setTime(newValue);
                      setCanStartTimer(dayjs().isBefore(newValue));
                      dispatch(
                        updateTimer({ id: props.id, date: newValue.valueOf() })
                      );
                    }
                  }}
                  readOnly={isRunning}
                  renderInput={(params) => <TextField {...params} />}
                />
                <Collapse in={!canStartTimer}>
                  <Alert severity="warning">
                    現在時刻より先の時間に設定してください。
                  </Alert>
                </Collapse>
              </LocalizationProvider>
              <Box sx={{ width: 1 }}>
                <Countdown
                  date={countdownDate}
                  renderer={countdownRender}
                  ref={(ref) => {
                    countdownApi = ref?.getApi();
                  }}
                  onComplete={completeTimer}
                  onTick={onCountdownTick}
                  overtime={true}
                  autoStart={false}
                  zeroPadTime={3}
                />
              </Box>
            </Box>
          </Box>
          <Box
            sx={{
              mt: 1,
              ml: 1,
              mr: 1,
            }}
          >
            <LinearProgress variant="determinate" value={progress.value} />
          </Box>
        </CardContent>
      </Card>
    </div>
  );
};

TimerCard.propTypes = {
  title: PropTypes.string,
};
TimerCard.defaultProps = {
  title: "timer",
};

export default TimerCard;
