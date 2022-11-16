import './App.css';
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers'
import contractABI from './contractabi.json'
import { CopyToClipboard } from 'react-copy-to-clipboard';

const contractAddress = "0x356C885249B9b44846E5584C43A8cE5D33Ba2553";

function App() {
  /*
    自動獲取的參數
    refAccount  : 讀取網頁連結 所得到的推薦人地址
  */
  let refAccount;

  /*
    預先設定的參數
    defaultIDOAddress : 預設的IDO地址
  */

  const defaultIDOAddress = "0x60e21c1C75E60a966734B4Dd0FE1D3ac7484F00A";
  const [errorMessage, setErrorMessage] = useState(null);
  const [defaultAccount, setDefaultAccount] = useState(null)
  const [connectButtonText, setConnectButtonText] = useState('Connect Wallet')
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [father, setFather] = useState(null);
  const [ancestor, setAncestor] = useState(null);
  const [refLink, setRefLink] = useState(null);
  const [copied, setCopied] = useState(false);
  const [correctNetwork, setCorrectNetwork] = useState(null);

  const [hasJoin, setHasJoin] = useState("未參與");
  const [directReward, setDirectReward] = useState(0);
  const [indirectReward, setIndirectReward] = useState(0)
  const [whiteReward, setWhiteReward] = useState(0)
  const [autoInvestReward, setAutoInvestReward] = useState(0)

  const [web3Number, setWeb3Number] = useState(0)
  const [web3NumberNow, setWeb3NumberNow] = useState(0)

  // useEffect(() => {
  //   connectWalletHandler()
  // }, [defaultAccount])

  /*
    ==========================================
    ==========================================
    
      ***  Functions for All project   ***
    
    ==========================================
    ==========================================
  */
  const connectWalletHandler = async () => {
    if (window.ethereum) {
      window.ethereum.request({ method: 'eth_requestAccounts' })
        .then(result => {
          accountChangeHandler(result[0]);
          setConnectButtonText('Wallet Connected');
        })
    } else {
      setErrorMessage('Need to install MetaMask!')
    }
  }

  //設定預設地址 以及 個人邀請連結
  const accountChangeHandler = async (newAccount) => {
    checkCorrectNetwork();
    setDefaultAccount(newAccount);
    let tempReflink = `https://17demo.pages.dev/invitedBy=${newAccount}`
    // let tempReflink = `localhost:3001/invitedBy=${newAccount}`
    setRefLink(tempReflink);

    await updateEthers();
  }

  const updateEthers = async () => {
    let tempProvider = new ethers.providers.Web3Provider(window.ethereum);
    setProvider(tempProvider);

    let tempSigner = tempProvider.getSigner();
    setSigner(tempSigner);

    let tempContract = new ethers.Contract(contractAddress, contractABI, tempSigner)
    setContract(tempContract);
  }

  const checkCorrectNetwork = async () => {
    const { ethereum } = window
    let chainId = await ethereum.request({ method: 'eth_chainId' })
    console.log('Connected to chain:' + chainId)

    const netWorkID = '0x61'

    if (chainId !== netWorkID) {
      setCorrectNetwork(false)
      alert("Please connect to BSC Testnet")
    } else {
      setCorrectNetwork(true)
    }
  }


  /*
    ==========================================
    ==========================================
    
      ***  Functions for this project   ***
    
    ==========================================
    ==========================================
  */
  const makePayment = async () => {

    if (correctNetwork === false) {
      alert("You cannot make payment before you change to the OKC Mainnet")
      return;
    }

    await getRef()

    const options = { value: ethers.utils.parseEther("0.105") }
    console.log(refAccount);
    let result = await contract.makeIDO(refAccount, options)
    console.log(result);
    if (result) {
      alert("付款正在提交")
    }
  }

  const getReward = async () => {
    let tempDirectReward = await contract.sonPromotionAmount(defaultAccount) * 0.3
    setDirectReward(tempDirectReward);
    let tempIndirectReward = await contract.grandsonPromotionAmount(defaultAccount) * 0.2
    setIndirectReward(tempIndirectReward);
    let tempWhiteReward = await contract.whiteTimes(defaultAccount) * 0.3
    setWhiteReward(tempWhiteReward);
    let tempAutoInvestReward = await contract.autoInvestTimes(defaultAccount) * 0.95
    setAutoInvestReward(tempAutoInvestReward);

    let web3Number = await contract.viewJoinIndexForCertainAddress(defaultAccount)
    if (web3Number.length > 0) {
      const initArray = [defaultAccount];
      initArray.pop();
      let index;
      for (index = 0; index < web3Number.length; index++) {
        if (index != web3Number.length - 1)
          initArray.push(`${parseInt(web3Number[index]._hex)},`)
        else
          initArray.push(parseInt(web3Number[index]._hex))
      }
      console.log(initArray);
      setWeb3Number(initArray);
    }
    let totalNumber = await contract.IDOTimes()
    let tempWeb3NumberNow = Math.floor(totalNumber / 4);
    setWeb3NumberNow(tempWeb3NumberNow);

    let tempHasJoin = await contract.hasJoined(defaultAccount)
    if (tempHasJoin === true) setHasJoin("已加入")
  }

  const seeFather = async () => {
    let tempFather = await contract.fatherAddress(defaultAccount)
    setFather(tempFather);
    let tempAncestor = await contract.ancestorAddress(defaultAccount)
    setAncestor(tempAncestor);
  }

  const getRef = async () => {
    let link = window.location.href

    if (link.includes('invitedBy=')) {
      let start = link.indexOf('By=')
      refAccount = link.substring(start + 3, start + 45)
    } else {
      refAccount = defaultIDOAddress
    }
  }

  const alertCopied = () => {
    if (defaultAccount === null) {
      alert("尚未連接錢包，無複製連結")
    }
    alert(`邀請連結已生成: ${refLink}`)
  }

  return (
    <div className="App">
      <header className="App-header">
        <h2>Demo Only</h2>
        <button onClick={connectWalletHandler}>{connectButtonText}</button>
        <h5> Address : {defaultAccount} </h5>
        {errorMessage}

        <CopyToClipboard text={refLink} onCopy={() => setCopied(true)}>
          <button id="inviteLink" className="tf-button btn-effect" onClick={alertCopied}>
            Copy Invite Link
          </button>
        </CopyToClipboard>

        <br />
        <button onClick={makePayment} >Make Payment</button>
        <br />
        <button onClick={getReward} >查看我的收益</button>
        <table className="StatusTable">
          <thead><tr><td className="headTop">個人資料</td></tr></thead>
          <tbody>
            <tr>
              <td align="left">身分組 :</td>
              <td align="right">{hasJoin}</td>
            </tr>
            <tr>
              <td align="left">身分編號  :</td>
              <td align="right">{web3Number}</td>
            </tr>
          </tbody>
        </table>
        <table className="RewardTable">
          <thead><tr><td className="headTop">個人獎勵</td></tr></thead>
          <tbody>
            <tr>
              <td align="left">直推獎勵  :</td>
              <td align="right">{directReward}  BNB</td>
            </tr>
            <tr>
              <td align="left">間推獎勵  :</td>
              <td align="right">{indirectReward}  BNB</td>
            </tr>
            <tr>
              <td align="left">共識推廣獎勵  :</td>
              <td align="right">{whiteReward}  BNB</td>
            </tr>
            <tr>
              <td align="left">Web3.0幸運獎勵  :</td>
              <td align="right">{autoInvestReward}  BNB</td>
            </tr>
          </tbody>
        </table>
        <table className="Web3Table">
          <thead><tr><td className="headTop">Web3.0 幸運獎池</td></tr></thead>
          <tbody>
            <tr>
              <td align="left">您的幸運號碼  :</td>
              <td align="right">{web3Number}</td>
            </tr>
            <tr>
              <td align="left">當前幸運號碼  :</td>
              <td align="right">{web3NumberNow}</td>
            </tr>
          </tbody>
        </table>
        <button onClick={seeFather} > See Father</button>
        <h5>你爹  ：{father}</h5>
        <h5>你祖先：{ancestor}</h5>
      </header>
    </div>
  );
}

export default App;
